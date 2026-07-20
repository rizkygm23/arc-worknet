import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  decodeEventLog,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  arcTestnet,
  ARC_RPC_URL,
  ARC_USDC_ADDRESS,
  ERC8183_CONTRACT_ADDRESS,
  erc20UsdcAbi,
  erc8183Abi,
} from "../src/lib/arc";

// ─────────────────────────────────────────────────────────────
//  Massive ERC-8183 Escrow Bot
//
//  Multi-pair escrow cycle simulator using 1000 bot wallets from
//  wallet.json, funded by 2 funding wallets from .env.
//
//  Pairing (fixed):
//    Pair N = (wallet[2N], wallet[2N+1])
//    Genap idx (0,2,4,...)  → Client  (evaluator)
//    Ganjil idx (1,3,5,...) → Worker  (provider)
//
//  Per cycle:
//    1. Threshold check: Client ≥ 5 USDC, Worker ≥ 1 USDC
//       → trigger topup: client +10 USDC, worker +5 USDC (from funding)
//    2. Budget acak 1-4 USDC
//    3. 6-step escrow: createJob → setBudget → approve → fund → submit → complete
//    4. Sync ke Supabase (profile + job row + statistik)
//    5. Sweep seluruh sisa balance kembali ke funding wallet dan verifikasi saldo 0
//
//  Startup: scan wallet 0..terakhir, sweep saldo lama ke funding wallet,
//  lalu resume dari pair pertama yang menemukan wallet kosong.
//  Loop abadi: resume pair → pair terakhir → kembali ke pair 0 → ulang.
//  Ctrl+C: sweep semua sisa 1000 wallet bot ke funding wallet.
// ─────────────────────────────────────────────────────────────

const usdcAbiWithTransfer = [
  ...erc20UsdcAbi,
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const escrowAbiWithNextJobId = [
  ...erc8183Abi,
  {
    type: "function",
    name: "nextJobId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// 1. Load environment variables manually from .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.warn("⚠️  .env file not found. Falling back to process.env.");
    return;
  }

  const content = fs.readFileSync(envPath, "utf-8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const firstEq = trimmed.indexOf("=");
      if (firstEq !== -1) {
        const key = trimmed.slice(0, firstEq).trim();
        const value = trimmed.slice(firstEq + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
      }
    }
  });
}

loadEnv();

// Funding wallet keys. Fall back to FIRST/SECOND_WALLET_PRIVATE_KEY
// for backward-compat with the single-cycle onchainTest.ts env.
const FUNDING_PK_1 =
  process.env.FUNDING_WALLET_PRIVATE_KEY_1 ?? process.env.FIRST_WALLET_PRIVATE_KEY;
const FUNDING_PK_2 =
  process.env.FUNDING_WALLET_PRIVATE_KEY_2 ?? process.env.SECOND_WALLET_PRIVATE_KEY;

if (!FUNDING_PK_1 || !FUNDING_PK_2) {
  console.error(
    "❌ Error: FUNDING_WALLET_PRIVATE_KEY_1 and FUNDING_WALLET_PRIVATE_KEY_2 must be set in your .env file.",
  );
  process.exit(1);
}

// Configurable constants
const STAGE_DELAY = 5000; // ms between tx steps
const PAIR_GAP = 3000; // ms between pairs
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// USDC (6 decimals) — all money math uses integer base units.
// Note: tsconfig targets ES2017, so BigInt() calls are used instead of
// `1_000_000n` literals (which require ES2020). Matches onchainTest.ts style.
const USDC = BigInt(1000000);
const CLIENT_THRESHOLD = BigInt(5) * USDC; // client must have ≥ 5 USDC
const WORKER_THRESHOLD = BigInt(1) * USDC; // worker must have ≥ 1 USDC
const CLIENT_TOPUP = BigInt(10) * USDC; // topup amount when client < threshold
const WORKER_TOPUP = BigInt(5) * USDC; // topup amount when worker < threshold
const SWEEP_BUFFER = BigInt(10000); // retain 0.01 USDC for Arc native-gas fee reserve
const BUDGET_MIN = BigInt(1) * USDC; // min random budget 1 USDC
const BUDGET_MAX = BigInt(4) * USDC; // max random budget 4 USDC

// ─────────────────────────────────────────────────────────────
//  Rate-limit aware RPC transport (shared queue, dynamic gap)
//  RPC testnet Arc punya limit request per-IP yang sangat ketat.
// ─────────────────────────────────────────────────────────────
let dynamicRequestGapMs = 500;
const MAX_REQUEST_GAP_MS = 10000;
const MAX_RATE_LIMIT_RETRIES = 50;
let lastRequestAt = 0;
let throttleQueue: Promise<void> = Promise.resolve();

function isRateLimitError(err: unknown, depth = 0): boolean {
  if (!err || typeof err !== "object" || depth > 10) return false;
  const e = err as {
    code?: number;
    status?: number;
    details?: string;
    shortMessage?: string;
    message?: string;
    cause?: unknown;
  };
  if (e.code === -32011 || e.code === -32005 || e.status === 429) return true;
  const text = `${e.details ?? ""} ${e.shortMessage ?? ""} ${e.message ?? ""}`.toLowerCase();
  if (
    text.includes("request limit") ||
    text.includes("rate limit") ||
    text.includes("too many request")
  ) {
    return true;
  }
  return isRateLimitError(e.cause, depth + 1);
}

function waitForRequestSlot(): Promise<void> {
  const myTurn = throttleQueue.then(async () => {
    const wait = lastRequestAt + dynamicRequestGapMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
  });
  throttleQueue = myTurn.catch(() => {});
  return myTurn;
}

const baseTransport = http(ARC_RPC_URL, { retryCount: 0 });

const rateLimitedTransport: typeof baseTransport = (params) => {
  const transport = baseTransport(params);
  const baseRequest = transport.request as unknown as (
    args: unknown,
    options?: unknown,
  ) => Promise<unknown>;

  const request = (async (args: unknown, options?: unknown) => {
    for (let attempt = 0; ; attempt++) {
      await waitForRequestSlot();
      try {
        return await baseRequest(args, options);
      } catch (err) {
        if (isRateLimitError(err) && attempt < MAX_RATE_LIMIT_RETRIES) {
          dynamicRequestGapMs = Math.min(dynamicRequestGapMs + 100, MAX_REQUEST_GAP_MS);
          console.log(
            `\x1b[33m  ⏳ RPC rate limited — increasing gap to ${dynamicRequestGapMs}ms (retry ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})\x1b[0m`,
          );
          await sleep(dynamicRequestGapMs);
          continue;
        }
        throw err;
      }
    }
  }) as unknown as typeof transport.request;

  return { ...transport, request };
};

// 2. Setup Viem clients
const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: rateLimitedTransport,
  pollingInterval: 3000,
});

type WalletBot = { address: string; privateKey: string };

// Funding wallet clients — created inline so TypeScript infers the full
// chain-bound type, matching onchainTest.ts's client1/client2 pattern.
const fundingAccount1 = privateKeyToAccount(FUNDING_PK_1 as `0x${string}`);
const fundingAccount2 = privateKeyToAccount(FUNDING_PK_2 as `0x${string}`);

const fundingWallet1 = createWalletClient({
  account: fundingAccount1,
  chain: arcTestnet,
  transport: rateLimitedTransport,
});

const fundingWallet2 = createWalletClient({
  account: fundingAccount2,
  chain: arcTestnet,
  transport: rateLimitedTransport,
});

// Derive the concrete WalletClient type from the inline funding wallet.
// Bot wallets created via makeWalletClient() use this same type.
type ArcWalletClient = typeof fundingWallet1;

// Bot wallet client cache. Loop abadi me-render ulang pair 0..499, jadi
// cache ini mencegah re-create 1000 WalletClient tiap iterasi.
const walletClientCache = new Map<string, ArcWalletClient>();

function makeWalletClient(privateKey: string): ArcWalletClient {
  const cached = walletClientCache.get(privateKey);
  if (cached) return cached;
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: arcTestnet,
    transport: rateLimitedTransport,
  }) as ArcWalletClient;
  walletClientCache.set(privateKey, client);
  return client;
}

// ─────────────────────────────────────────────────────────────
//  Pretty output helpers
// ─────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const fmtUsdc = (v: bigint) =>
  `${Number(formatUnits(v, 6)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} USDC`;

const shortHash = (h: string) => `${h.slice(0, 10)}…${h.slice(-8)}`;
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ${rs}s`;
}

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

// Session statistics
const stats = {
  startedAt: Date.now(),
  pairsCompleted: 0,
  cyclesFailed: 0,
  totalVolume: BigInt(0),
  totalTopup: BigInt(0),
  totalTopupCount: 0,
  totalSwept: BigInt(0),
  recoveredJobs: 0,
  recoveredVolume: BigInt(0),
  totalTx: 0,
  lastJobId: null as bigint | null,
  sweepCompleted: 0,
};

function trackTx() {
  stats.totalTx++;
}

function logStep(step: number, total: number, emoji: string, title: string) {
  console.log(
    `\n${C.bold}${C.cyan}  [${step}/${total}]${C.reset} ${emoji} ${C.bold}${title}${C.reset}`,
  );
}

function logTx(hash: string, ms: number, extra = "") {
  console.log(
    `        ${C.green}✔${C.reset} confirmed in ${C.yellow}${fmtDuration(ms)}${C.reset}  ${C.gray}tx ${shortHash(hash)}${C.reset}${extra ? `  ${extra}` : ""}`,
  );
}

function printSessionDashboard() {
  const uptimeMs = Date.now() - stats.startedAt;
  const txPerMin = uptimeMs > 0 ? ((stats.totalTx / uptimeMs) * 60000).toFixed(1) : "0";

  const b = `${C.magenta}║${C.reset}`;
  console.log("");
  console.log(`  ${C.magenta}${C.bold}╔══════════════ 📊 SESSION DASHBOARD ══════════════╗${C.reset}`);
  console.log(`  ${b} ⏱  Uptime           : ${C.bold}${fmtUptime(uptimeMs)}${C.reset}`);
  console.log(`  ${b} 🤝 Pairs Completed  : ${C.bold}${C.green}${stats.pairsCompleted}${C.reset}`);
  console.log(`  ${b} 💰 Total Volume     : ${C.bold}${C.green}${fmtUsdc(stats.totalVolume)}${C.reset}`);
  console.log(`  ${b} 💸 Total Topup      : ${fmtUsdc(stats.totalTopup)} ${C.gray}(${stats.totalTopupCount}x)${C.reset}`);
  console.log(`  ${b} 🔄 Total Swept      : ${fmtUsdc(stats.totalSwept)} ${C.gray}(${stats.sweepCompleted}x)${C.reset}`);
  console.log(`  ${b} 🧾 Total TXs Sent   : ${C.bold}${stats.totalTx}${C.reset} ${C.gray}(~${txPerMin} tx/min)${C.reset}`);
  if (stats.recoveredJobs > 0) {
    console.log(
      `  ${b} 🛠  Recovered Jobs   : ${stats.recoveredJobs} (${fmtUsdc(stats.recoveredVolume)} unlocked)`,
    );
  }
  if (stats.cyclesFailed > 0) {
    console.log(`  ${b} ❌ Failed Cycles    : ${C.red}${stats.cyclesFailed}${C.reset}`);
  }
  if (stats.lastJobId !== null) {
    console.log(`  ${b} 🆔 Last Job ID      : #${stats.lastJobId}`);
  }
  console.log(`  ${C.magenta}${C.bold}╚═══════════════════════════════════════════════════╝${C.reset}`);
}

// ─────────────────────────────────────────────────────────────
//  Balance + transfer helpers
// ─────────────────────────────────────────────────────────────
async function readUsdcBalance(address: string): Promise<bigint> {
  const bal = await publicClient.readContract({
    address: ARC_USDC_ADDRESS,
    abi: erc20UsdcAbi,
    functionName: "balanceOf",
    args: [address as Hex],
  });
  return BigInt(bal);
}

async function transferUsdc(
  fromWallet: ArcWalletClient,
  toAddress: string,
  amount: bigint,
): Promise<bigint> {
  // Arc native USDC has 18 decimals; ERC-20 balance/amounts have 6 decimals.
  const hash = await fromWallet.sendTransaction({
    to: toAddress as Hex,
    value: amount * BigInt(1000000000000),
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`USDC transfer reverted: ${hash}`);
  }
  trackTx();
  return receipt.blockNumber;
}

// Sweep all USDC from a wallet to a target, then verify no balance remains.
async function sweepBalance(
  fromWallet: ArcWalletClient,
  fromAddress: string,
  toAddress: string,
): Promise<bigint> {
  const balance = await readUsdcBalance(fromAddress);
  if (balance <= SWEEP_BUFFER) return BigInt(0);

  const amount = balance - SWEEP_BUFFER;
  await transferUsdc(fromWallet, toAddress, amount);

  const remaining = await readUsdcBalance(fromAddress);
  if (remaining > SWEEP_BUFFER) {
    throw new Error(
      `Sweep verification failed for ${fromAddress}: ${fmtUsdc(remaining)} remains`,
    );
  }

  stats.totalSwept += amount;
  stats.sweepCompleted++;
  return amount;
}

// ─────────────────────────────────────────────────────────────
//  Topup logic: funding wallet seeds bot wallets under threshold
// ─────────────────────────────────────────────────────────────
async function getAvailableFundingWallet(requiredAmount: bigint): Promise<{
  wallet: ArcWalletClient;
  accountAddress: string;
  name: string;
}> {
  const bal1 = await readUsdcBalance(fundingAccount1.address);
  const bal2 = await readUsdcBalance(fundingAccount2.address);

  if (bal1 >= requiredAmount && bal1 >= bal2) {
    return { wallet: fundingWallet1, accountAddress: fundingAccount1.address, name: "funding1" };
  }
  if (bal2 >= requiredAmount) {
    return { wallet: fundingWallet2, accountAddress: fundingAccount2.address, name: "funding2" };
  }
  if (bal1 >= requiredAmount) {
    return { wallet: fundingWallet1, accountAddress: fundingAccount1.address, name: "funding1" };
  }

  throw new Error(
    `Insufficient funding balance for topup: required ${fmtUsdc(requiredAmount)}, but Funding1 has ${fmtUsdc(bal1)} and Funding2 has ${fmtUsdc(bal2)}`,
  );
}

async function topupIfNeeded(
  clientWallet: ArcWalletClient,
  clientAddress: string,
  workerWallet: ArcWalletClient,
  workerAddress: string,
): Promise<void> {
  const clientBal = await readUsdcBalance(clientAddress);
  if (clientBal < CLIENT_THRESHOLD) {
    console.log(
      `  ${C.yellow}[Topup]${C.reset} client ${shortAddr(clientAddress)} low (${fmtUsdc(clientBal)} < ${fmtUsdc(CLIENT_THRESHOLD)})`,
    );
    const funder = await getAvailableFundingWallet(CLIENT_TOPUP);
    await transferUsdc(funder.wallet, clientAddress, CLIENT_TOPUP);
    stats.totalTopup += CLIENT_TOPUP;
    stats.totalTopupCount++;
    console.log(
      `        ${C.green}✔${C.reset} funded ${fmtUsdc(CLIENT_TOPUP)} from ${funder.name} ${C.gray}${shortAddr(funder.accountAddress)}${C.reset}`,
    );
    await sleep(STAGE_DELAY);
  }

  const workerBal = await readUsdcBalance(workerAddress);
  if (workerBal < WORKER_THRESHOLD) {
    console.log(
      `  ${C.yellow}[Topup]${C.reset} worker ${shortAddr(workerAddress)} low (${fmtUsdc(workerBal)} < ${fmtUsdc(WORKER_THRESHOLD)})`,
    );
    const funder = await getAvailableFundingWallet(WORKER_TOPUP);
    await transferUsdc(funder.wallet, workerAddress, WORKER_TOPUP);
    stats.totalTopup += WORKER_TOPUP;
    stats.totalTopupCount++;
    console.log(
      `        ${C.green}✔${C.reset} funded ${fmtUsdc(WORKER_TOPUP)} from ${funder.name} ${C.gray}${shortAddr(funder.accountAddress)}${C.reset}`,
    );
    await sleep(STAGE_DELAY);
  }
}

function randomBudget(): bigint {
  // Uniform integer USDC between BUDGET_MIN and BUDGET_MAX inclusive.
  const units = Number(BUDGET_MIN / USDC);
  const maxUnits = Number(BUDGET_MAX / USDC);
  const pick = units + Math.floor(Math.random() * (maxUnits - units + 1));
  return BigInt(pick) * USDC;
}

// ─────────────────────────────────────────────────────────────
//  DB sync (Supabase) — reused pattern from onchainTest.ts
// ─────────────────────────────────────────────────────────────
async function syncJobToDatabase({
  clientAddress,
  providerAddress,
  budgetUnits,
  jobIdOnchain,
  createTxHash,
  completeTxHash,
}: {
  clientAddress: string;
  providerAddress: string;
  budgetUnits: bigint;
  jobIdOnchain: bigint;
  createTxHash: string;
  completeTxHash: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.log(`${C.gray}   Supabase credentials not found in env, skipping DB sync.${C.reset}`);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const getOrCreateProfile = async (address: string, role: "client" | "worker") => {
    const formattedAddr = address.toLowerCase();

    const { data: profile } = await supabase
      .from("profiles_arcworker")
      .select("id")
      .eq("wallet_address", formattedAddr)
      .maybeSingle();

    if (profile) return profile.id;

    const { data: newProfile, error } = await supabase
      .from("profiles_arcworker")
      .insert({
        wallet_address: formattedAddr,
        display_name: `${role.toUpperCase()} ${address.slice(0, 6)}`,
        role: role,
        skills: role === "worker" ? ["Solidity", "TypeScript"] : [],
      })
      .select("id")
      .single();

    if (error) {
      console.error(`Error creating profile for ${address}:`, error.message);
      throw error;
    }
    return newProfile.id;
  };

  try {
    const clientProfileId = await getOrCreateProfile(clientAddress, "client");
    const providerProfileId = await getOrCreateProfile(providerAddress, "worker");

    const title = `Onchain Job #${jobIdOnchain}`;
    const brief = `Automated massive cycle test job executed directly onchain. (Job ID: ${jobIdOnchain})`;
    const acceptance = "Successful completion of all 6 onchain simulation steps.";

    const { error: insertErr } = await supabase
      .from("jobs_arcworker")
      .insert({
        client_profile_id: clientProfileId,
        provider_profile_id: providerProfileId,
        title,
        brief,
        acceptance_criteria: acceptance,
        budget_usdc_units: Number(budgetUnits),
        status: "completed",
        category: "simulation",
        evaluator_address: clientAddress.toLowerCase(),
        provider_address: providerAddress.toLowerCase(),
        arc_contract_address: ERC8183_CONTRACT_ADDRESS.toLowerCase(),
        arc_job_id: jobIdOnchain.toString(),
        create_tx_hash: createTxHash,
        complete_tx_hash: completeTxHash,
      });

    if (insertErr) {
      console.error("Error inserting completed job to DB:", insertErr.message);
      return;
    }
    console.log(`        ${C.green}✔${C.reset} Job #${jobIdOnchain} synced to Supabase`);

    const { data: clientProf } = await supabase
      .from("profiles_arcworker")
      .select("total_spent_usdc_units")
      .eq("id", clientProfileId)
      .single();
    const currentSpent = BigInt(clientProf?.total_spent_usdc_units || 0);
    await supabase
      .from("profiles_arcworker")
      .update({ total_spent_usdc_units: Number(currentSpent + budgetUnits) })
      .eq("id", clientProfileId);

    const { data: providerProf } = await supabase
      .from("profiles_arcworker")
      .select("total_earned_usdc_units, completed_jobs_count")
      .eq("id", providerProfileId)
      .single();
    const currentEarned = BigInt(providerProf?.total_earned_usdc_units || 0);
    const currentCompleted = Number(providerProf?.completed_jobs_count || 0);
    await supabase
      .from("profiles_arcworker")
      .update({
        total_earned_usdc_units: Number(currentEarned + budgetUnits),
        completed_jobs_count: currentCompleted + 1,
      })
      .eq("id", providerProfileId);

    console.log(
      `        ${C.green}✔${C.reset} Profile stats updated (client spent / provider earned)`,
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to sync job to database:", errorMsg);
  }
}

// ─────────────────────────────────────────────────────────────
//  6-step escrow happy path (one cycle)
// ─────────────────────────────────────────────────────────────
async function runOneCycle(
  clientWallet: ArcWalletClient,
  clientAddress: string,
  workerWallet: ArcWalletClient,
  workerAddress: string,
  budget: bigint,
): Promise<{ jobId: bigint; createHash: string; completeHash: string }> {
  // Step 1: createJob
  logStep(1, 6, "📝", `createJob — client ${shortAddr(clientAddress)} hires worker ${shortAddr(workerAddress)}`);
  let t0 = Date.now();
  const createHash = await clientWallet.writeContract({
    address: ERC8183_CONTRACT_ADDRESS,
    abi: erc8183Abi,
    functionName: "createJob",
    args: [
      workerAddress as Hex, // provider
      clientAddress as Hex, // evaluator (client)
      BigInt(0), // expiredAt (no expiration)
      "Massive Simulation Run",
      "0x0000000000000000000000000000000000000000", // hook
    ],
  });
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
  trackTx();

  let jobId: bigint | undefined;
  for (const log of createReceipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: erc8183Abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "JobCreated") {
        jobId = (decoded.args as { jobId: bigint }).jobId;
        break;
      }
    } catch {
      // skip unrelated logs
    }
  }
  if (jobId === undefined) {
    throw new Error("Could not find JobCreated event log in tx receipt.");
  }
  logTx(
    createHash,
    Date.now() - t0,
    `${C.bold}Job ID #${jobId}${C.reset} ${C.gray}(block ${createReceipt.blockNumber})${C.reset}`,
  );
  stats.lastJobId = jobId;
  await sleep(STAGE_DELAY);

  // Step 2: setBudget
  logStep(2, 6, "💵", `setBudget — locking in ${fmtUsdc(budget)}`);
  t0 = Date.now();
  const budgetHash = await clientWallet.writeContract({
    address: ERC8183_CONTRACT_ADDRESS,
    abi: erc8183Abi,
    functionName: "setBudget",
    args: [jobId, budget, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: budgetHash });
  trackTx();
  logTx(budgetHash, Date.now() - t0);
  await sleep(STAGE_DELAY);

  // Step 3: approve USDC for escrow
  logStep(3, 6, "🔓", "approve — allowing escrow to spend client USDC");
  t0 = Date.now();
  const approveHash = await clientWallet.writeContract({
    address: ARC_USDC_ADDRESS,
    abi: erc20UsdcAbi,
    functionName: "approve",
    args: [ERC8183_CONTRACT_ADDRESS, budget],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  trackTx();
  logTx(approveHash, Date.now() - t0);

  // Poll allowance to ensure RPC node has synced before calling fund
  let allowanceSynced = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    const currentAllowance = await publicClient.readContract({
      address: ARC_USDC_ADDRESS,
      abi: erc20UsdcAbi,
      functionName: "allowance",
      args: [clientAddress as Hex, ERC8183_CONTRACT_ADDRESS],
    });
    if (BigInt(currentAllowance) >= budget) {
      allowanceSynced = true;
      break;
    }
    await sleep(1000);
  }
  if (!allowanceSynced) {
    console.warn(`        ${C.yellow}⚠️  Allowance might not be synced yet on the RPC node.${C.reset}`);
  }
  await sleep(STAGE_DELAY);

  // Step 4: fund
  logStep(4, 6, "🏦", "fund — depositing budget into escrow");
  t0 = Date.now();
  const fundHash = await clientWallet.writeContract({
    address: ERC8183_CONTRACT_ADDRESS,
    abi: erc8183Abi,
    functionName: "fund",
    args: [jobId, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  trackTx();
  logTx(fundHash, Date.now() - t0);
  await sleep(STAGE_DELAY);

  // Step 5: submit deliverable (by worker)
  logStep(5, 6, "📦", "submit — worker delivering the work");
  t0 = Date.now();
  const deliverableHash = "0x1234567890123456789012345678901234567890123456789012345678901234" as Hex;
  const submitHash = await workerWallet.writeContract({
    address: ERC8183_CONTRACT_ADDRESS,
    abi: erc8183Abi,
    functionName: "submit",
    args: [jobId, deliverableHash, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: submitHash });
  trackTx();
  logTx(submitHash, Date.now() - t0);
  await sleep(STAGE_DELAY);

  // Step 6: complete (release funds to worker)
  logStep(6, 6, "🏁", "complete — releasing funds to worker");
  t0 = Date.now();
  const completionReasonHash =
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Hex;
  const completeHash = await clientWallet.writeContract({
    address: ERC8183_CONTRACT_ADDRESS,
    abi: erc8183Abi,
    functionName: "complete",
    args: [jobId, completionReasonHash, "0x"],
  });
  await publicClient.waitForTransactionReceipt({ hash: completeHash });
  trackTx();
  logTx(completeHash, Date.now() - t0);

  return { jobId, createHash, completeHash };
}

// ─────────────────────────────────────────────────────────────
//  Stuck job recovery (scan last 50 jobs, rescue locked USDC)
//  Sama dengan onchainTest.ts tapi wallet-set diambil dari botWallets.
// ─────────────────────────────────────────────────────────────
let botWalletAddresses = new Set<string>();

async function recoverStuckJobs(scanLimit?: number) {
  console.log(`\n${C.blue}${C.bold}🔍 Scanning for stuck escrow jobs on-chain...${C.reset}`);
  try {
    const nextJobIdRaw = await publicClient.readContract({
      address: ERC8183_CONTRACT_ADDRESS,
      abi: escrowAbiWithNextJobId,
      functionName: "nextJobId",
    });
    const nextJobId = BigInt(nextJobIdRaw);
    if (nextJobId <= BigInt(1)) {
      console.log(`${C.green}   No escrow jobs to recover.${C.reset}\n`);
      return;
    }

    const startScan = nextJobId - BigInt(1);
    const endScan =
      scanLimit === undefined || startScan <= BigInt(scanLimit)
        ? BigInt(1)
        : startScan - BigInt(scanLimit) + BigInt(1);

    console.log(`${C.gray}   Range: Job #${startScan} → #${endScan}${C.reset}`);
    for (let id = startScan; id >= endScan; id--) {
      process.stdout.write(
        `\r${C.gray}   Checking Job #${id} (${startScan - id + BigInt(1)}/${startScan - endScan + BigInt(1)})...\x1b[K${C.reset}`,
      );
      const job = await publicClient.readContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "jobs",
        args: [id],
      });

      const client = job[0] as string;
      const provider = job[1] as string;
      const fundedAmount = BigInt(job[5]);
      const status = Number(job[10]);

      const isBotWallet = (addr: string) => botWalletAddresses.has(addr.toLowerCase());

      // Only rescue jobs whose client+provider are bot wallets and funds are locked.
      if (isBotWallet(client) && isBotWallet(provider) && fundedAmount > BigInt(0)) {
        if (status === 3 || status === 4 || status === 5) {
          console.log(
            `\n\n${C.yellow}⚠️  Found stuck Job #${id} with ${C.bold}${fmtUsdc(fundedAmount)}${C.reset}${C.yellow} locked!${C.reset}`,
          );

          const clientWallet = makeWalletClient(findPrivateKeyByAddress(client)!);
          const providerWallet = makeWalletClient(findPrivateKeyByAddress(provider)!);

          if (status === 3 || status === 5) {
            console.log(`   🛠  [Recovery] Submitting deliverable for Job #${id}...`);
            const mockDeliverable =
              "0x1234567890123456789012345678901234567890123456789012345678901234" as Hex;
            const submitHash = await providerWallet.writeContract({
              address: ERC8183_CONTRACT_ADDRESS,
              abi: erc8183Abi,
              functionName: "submit",
              args: [id, mockDeliverable, "0x"],
            });
            await publicClient.waitForTransactionReceipt({ hash: submitHash });
            trackTx();
            console.log(
              `   ${C.green}✔${C.reset} Deliverable submitted ${C.gray}tx ${shortHash(submitHash)}${C.reset}`,
            );
            await sleep(STAGE_DELAY);
          }

          console.log(`   🛠  [Recovery] Releasing funds (completing) Job #${id}...`);
          const mockReason =
            "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Hex;
          const completeHash = await clientWallet.writeContract({
            address: ERC8183_CONTRACT_ADDRESS,
            abi: erc8183Abi,
            functionName: "complete",
            args: [id, mockReason, "0x"],
          });
          await publicClient.waitForTransactionReceipt({ hash: completeHash });
          trackTx();
          stats.recoveredJobs++;
          stats.recoveredVolume += fundedAmount;
          console.log(
            `   ${C.green}✔ Job #${id} recovered — ${fmtUsdc(fundedAmount)} released to provider!${C.reset} ${C.gray}tx ${shortHash(completeHash)}${C.reset}`,
          );

          await sleep(STAGE_DELAY);
        }
      }
    }
    console.log(
      `\n${C.green}   Scan complete — ${stats.recoveredJobs} stuck job(s) recovered.${C.reset}\n`,
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error during stuck jobs recovery scan:", errorMsg);
  }
}

// ─────────────────────────────────────────────────────────────
//  Bot wallet loader + address lookup
// ─────────────────────────────────────────────────────────────
let botWalletsByAddress = new Map<string, string>(); // lowercased addr → privateKey

function findPrivateKeyByAddress(address: string): string | undefined {
  return botWalletsByAddress.get(address.toLowerCase());
}

function loadBotWallets(): WalletBot[] {
  const walletPath = path.resolve(process.cwd(), "wallet.json");
  if (!fs.existsSync(walletPath)) {
    console.error(`❌ wallet.json not found at ${walletPath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(walletPath, "utf-8")) as Array<{
    address: string;
    privateKey: string;
    mnemonic?: string;
  }>;

  // Build lookup tables for recovery + final sweep.
  botWalletsByAddress.clear();
  botWalletAddresses.clear();
  for (const w of raw) {
    const lower = w.address.toLowerCase();
    botWalletsByAddress.set(lower, w.privateKey);
    botWalletAddresses.add(lower);
  }

  return raw.map((w) => ({ address: w.address, privateKey: w.privateKey }));
}

// ─────────────────────────────────────────────────────────────
//  Startup balance recovery: scan wallet.json in order and resume
//  from the first pair containing an empty wallet.
// ─────────────────────────────────────────────────────────────
async function scanWalletBalancesForResume(bots: WalletBot[]): Promise<number> {
  console.log(
    `\n${C.blue}${C.bold}🔍 Scanning bot wallet balances from wallet #1...${C.reset}`,
  );

  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    const balance = await readUsdcBalance(bot.address);
    process.stdout.write(
      `\r${C.gray}   Checking wallet #${i + 1}/${bots.length} ${shortAddr(bot.address)}: ${fmtUsdc(balance)}\x1b[K${C.reset}`,
    );

    if (balance <= SWEEP_BUFFER) {
      const pairIdx = Math.floor(i / 2);
      console.log(
        `\n${C.green}   Empty wallet found at #${i + 1}; resuming from pair #${pairIdx + 1}.${C.reset}\n`,
      );
      return pairIdx;
    }

    const wallet = makeWalletClient(bot.privateKey);
    const swept = await sweepBalance(wallet, bot.address, fundingAccount1.address);
    console.log(
      `\n   ${C.green}✔${C.reset} Wallet #${i + 1} ${shortAddr(bot.address)} → funding1 ${fmtUsdc(swept)}`,
    );
  }

  console.log(
    `\n${C.green}   All wallets scanned and cleared; restarting from pair #1.${C.reset}\n`,
  );
  return 0;
}

// ─────────────────────────────────────────────────────────────
//  Final sweep (Ctrl+C): pull all bot USDC back to funding1.
// ─────────────────────────────────────────────────────────────
let shutdownRequested = false;

async function finalSweepToFunding(bots: WalletBot[]) {
  console.log(`\n${C.magenta}${C.bold}🧹 Final sweep — returning all bot balances to funding wallet...${C.reset}`);
  let totalRecovered = BigInt(0);
  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    try {
      const wallet = makeWalletClient(bot.privateKey);
      const swept = await sweepBalance(wallet, bot.address, fundingAccount1.address);
      if (swept > BigInt(0)) {
        totalRecovered += swept;
        console.log(
          `   ${C.green}✔${C.reset} Bot #${i + 1} ${shortAddr(bot.address)} → ${fmtUsdc(swept)}`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`   ${C.yellow}⚠️  Bot #${i + 1} ${shortAddr(bot.address)} sweep failed: ${msg}${C.reset}`);
    }
  }
  console.log(
    `${C.green}${C.bold}   ✔ Final sweep done — ${fmtUsdc(totalRecovered)} returned to funding1.${C.reset}`,
  );
}

// ─────────────────────────────────────────────────────────────
//  Main: pair processing loop (abadi)
// ─────────────────────────────────────────────────────────────
async function main() {
  const bots = loadBotWallets();
  const totalBots = bots.length;
  if (totalBots < 2 || totalBots % 2 !== 0) {
    console.error(`❌ wallet.json must contain an even number of wallets ≥ 2 (got ${totalBots}).`);
    process.exit(1);
  }
  const totalPairs = totalBots / 2;

  console.log(`${C.magenta}${C.bold}`);
  console.log("  ╔══════════════════════════════════════════════════╗");
  console.log("  ║   🤖  WORKNET — MASSIVE ONCHAIN VOLUME BOT  🤖   ║");
  console.log("  ║      Multi-Pair ERC-8183 Escrow Simulator        ║");
  console.log("  ╚══════════════════════════════════════════════════╝");
  console.log(C.reset);
  console.log(`  ${C.gray}Funding Wallet 1 :${C.reset} ${fundingAccount1.address}`);
  console.log(`  ${C.gray}Funding Wallet 2 :${C.reset} ${fundingAccount2.address}`);
  console.log(`  ${C.gray}Bot Wallets      :${C.reset} ${totalBots} (${totalPairs} pairs)`);
  console.log(`  ${C.gray}Escrow Contract  :${C.reset} ${ERC8183_CONTRACT_ADDRESS}`);
  console.log(`  ${C.gray}USDC Contract    :${C.reset} ${ARC_USDC_ADDRESS}`);
  console.log(`  ${C.gray}RPC              :${C.reset} ${ARC_RPC_URL}`);
  console.log(`  ${C.gray}Thresholds       :${C.reset} client ≥ ${fmtUsdc(CLIENT_THRESHOLD)}, worker ≥ ${fmtUsdc(WORKER_THRESHOLD)}`);
  console.log(`  ${C.gray}Topup Amounts    :${C.reset} client +${fmtUsdc(CLIENT_TOPUP)}, worker +${fmtUsdc(WORKER_TOPUP)}`);
  console.log(`  ${C.gray}Budget Range     :${C.reset} ${fmtUsdc(BUDGET_MIN)} – ${fmtUsdc(BUDGET_MAX)} per cycle`);

  // Initial funding wallet sanity check.
  const funding1Bal = await readUsdcBalance(fundingAccount1.address);
  const funding2Bal = await readUsdcBalance(fundingAccount2.address);
  console.log(`\n  ${C.gray}Funding1 balance :${C.reset} ${fmtUsdc(funding1Bal)}`);
  console.log(`  ${C.gray}Funding2 balance :${C.reset} ${fmtUsdc(funding2Bal)}`);
  if (funding1Bal < CLIENT_TOPUP && funding2Bal < CLIENT_TOPUP && funding1Bal + funding2Bal < CLIENT_TOPUP) {
    console.warn(
      `  ${C.yellow}⚠️  Both funding wallets low — bot may fail when topups are required.${C.reset}`,
    );
  }

  // First SIGINT lets the active pair settle before cleanup; second forces exit.
  process.on("SIGINT", () => {
    if (shutdownRequested) {
      console.log(`\n${C.red}Force quit.${C.reset}`);
      process.exit(1);
    }
    shutdownRequested = true;
    console.log(
      `\n${C.yellow}🛑 SIGINT received — finishing the active pair before final sweep...${C.reset}`,
    );
  });

  // Sweep balances left by earlier runs and identify the first unprocessed pair.
  const resumePairIdx = await scanWalletBalancesForResume(bots);
  await sleep(2000);

  // Outer loop: iterate pair 0..(totalPairs-1), then repeat forever.
  let iteration = 0;
  while (true) {
    iteration++;
    console.log(
      `\n${C.cyan}${C.bold}╔══════════════════════════════════════════════════╗${C.reset}`,
    );
    console.log(
      `${C.cyan}${C.bold}║  🌐 ITERATION #${String(iteration).padEnd(4)} • Uptime ${fmtUptime(Date.now() - stats.startedAt)} • Pairs: ${String(stats.pairsCompleted).padEnd(5)}  ║${C.reset}`,
    );
    console.log(
      `${C.cyan}${C.bold}╚══════════════════════════════════════════════════╝${C.reset}`,
    );

    const firstPairIdx = iteration === 1 ? resumePairIdx : 0;
    for (let pairIdx = firstPairIdx; pairIdx < totalPairs; pairIdx++) {
      if (shutdownRequested) break;

      const clientIdx = pairIdx * 2;
      const workerIdx = pairIdx * 2 + 1;
      const clientBot = bots[clientIdx];
      const workerBot = bots[workerIdx];
      const clientWallet = makeWalletClient(clientBot.privateKey);
      const workerWallet = makeWalletClient(workerBot.privateKey);

      const cycleStart = Date.now();
      console.log(
        `\n${C.blue}${C.bold}┌────────────────────────────────────────────────────┐${C.reset}`,
      );
      console.log(
        `${C.blue}${C.bold}│ 🔁 PAIR #${String(pairIdx + 1).padEnd(4)} (iter ${iteration}) • client #${clientIdx} ↔ worker #${workerIdx} • Done: ${String(stats.pairsCompleted).padEnd(5)}│${C.reset}`,
      );
      console.log(
        `${C.blue}${C.bold}└────────────────────────────────────────────────────┘${C.reset}`,
      );

      try {
        // 1. Topup check (funding seeds bot wallets under threshold).
        await topupIfNeeded(
          clientWallet,
          clientBot.address,
          workerWallet,
          workerBot.address,
        );

        // 3. Random budget 1-4 USDC.
        const budget = randomBudget();

        // 4. Run 6-step escrow cycle.
        const { jobId, createHash, completeHash } = await runOneCycle(
          clientWallet,
          clientBot.address,
          workerWallet,
          workerBot.address,
          budget,
        );

        // Read post-cycle balances for reporting.
        const clientFinal = await readUsdcBalance(clientBot.address);
        const workerFinal = await readUsdcBalance(workerBot.address);

        stats.pairsCompleted++;
        stats.totalVolume += budget;

        const cycleMs = Date.now() - cycleStart;
        console.log(
          `\n  ${C.green}${C.bold}🎉 PAIR #${pairIdx + 1} (Job #${jobId}) COMPLETE${C.reset} ${C.gray}— cycle in ${C.reset}${C.yellow}${fmtDuration(cycleMs)}${C.reset}`,
        );
        console.log(`  ${C.gray}├${C.reset} 💸 Volume moved   : ${C.bold}${fmtUsdc(budget)}${C.reset}`);
        console.log(`  ${C.gray}├${C.reset} 🧑‍💼 Client balance : ${fmtUsdc(clientFinal)}`);
        console.log(`  ${C.gray}└${C.reset} 👷 Worker balance : ${fmtUsdc(workerFinal)}`);

        // 5. DB sync (Supabase).
        console.log(`\n  ${C.blue}🗄  Syncing to database...${C.reset}`);
        await syncJobToDatabase({
          clientAddress: clientBot.address,
          providerAddress: workerBot.address,
          budgetUnits: budget,
          jobIdOnchain: jobId,
          createTxHash: createHash,
          completeTxHash: completeHash,
        });

        await sleep(PAIR_GAP);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        stats.cyclesFailed++;
        console.error(`\n  ${C.red}❌ PAIR #${pairIdx + 1} failed: ${errorMsg}${C.reset}`);

        if (isRateLimitError(err)) {
          const cooldownMs = 60000;
          console.log(
            `  ${C.yellow}🧊 Cooling down ${cooldownMs / 1000}s before recovery...${C.reset}`,
          );
          await sleep(cooldownMs);
        }

        // Current job is among the newest entries; release any funded USDC now.
        await recoverStuckJobs(10);
        await sleep(PAIR_GAP);
      } finally {
        // Always return processed pair balances to funding1, including failed cycles.
        // A failed cleanup stops the bot so funds cannot be silently left behind.
        const sweptC = await sweepBalance(clientWallet, clientBot.address, fundingAccount1.address);
        const sweptW = await sweepBalance(workerWallet, workerBot.address, fundingAccount1.address);
        if (sweptC > BigInt(0) || sweptW > BigInt(0)) {
          console.log(
            `  ${C.gray}Cleanup pair #${pairIdx + 1}: ${fmtUsdc(sweptC + sweptW)} returned to funding1${C.reset}`,
          );
        }
      }
    }

    if (shutdownRequested) break;

    // End of iteration — show running totals then loop again.
    printSessionDashboard();
  }

  // Only reached on graceful shutdown mid-loop.
  await finalSweepToFunding(bots);
  printSessionDashboard();
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
