import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  decodeEventLog,
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

const FIRST_WALLET_PRIVATE_KEY = process.env.FIRST_WALLET_PRIVATE_KEY;
const SECOND_WALLET_PRIVATE_KEY = process.env.SECOND_WALLET_PRIVATE_KEY;

if (!FIRST_WALLET_PRIVATE_KEY || !SECOND_WALLET_PRIVATE_KEY) {
  console.error("❌ Error: FIRST_WALLET_PRIVATE_KEY and SECOND_WALLET_PRIVATE_KEY must be set in your .env file.");
  process.exit(1);
}

// Helper for waiting/sleeping
const STAGE_DELAY = 2000; // Delay in ms between transaction steps
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────
//  Rate-limit aware RPC transport
//  RPC testnet Arc punya limit request per-IP yang sangat ketat.
//  Transport ini (1) memberi jeda antar SEMUA request RPC dari
//  semua client lewat satu antrian global, dan (2) retry dengan
//  exponential backoff saat node menjawab "request limit reached"
//  (code -32011), termasuk untuk polling receipt internal viem.
// ─────────────────────────────────────────────────────────────
const MIN_REQUEST_GAP_MS = Number(process.env.RPC_MIN_REQUEST_GAP_MS || 750);
const MAX_RATE_LIMIT_RETRIES = 8;
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

// All clients share one queue so total traffic stays under the IP limit
function waitForRequestSlot(): Promise<void> {
  const myTurn = throttleQueue.then(async () => {
    const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
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
    options?: unknown
  ) => Promise<unknown>;

  const request = (async (args: unknown, options?: unknown) => {
    for (let attempt = 0; ; attempt++) {
      await waitForRequestSlot();
      try {
        return await baseRequest(args, options);
      } catch (err) {
        if (isRateLimitError(err) && attempt < MAX_RATE_LIMIT_RETRIES) {
          const backoffMs = Math.min(2000 * 2 ** attempt, 30000);
          console.log(
            `\x1b[33m  ⏳ RPC rate limited — retry ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES} in ${(backoffMs / 1000).toFixed(0)}s...\x1b[0m`
          );
          await sleep(backoffMs);
          continue;
        }
        throw err;
      }
    }
  }) as unknown as typeof transport.request;

  return { ...transport, request };
};

// 2. Setup Viem Clients
const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: rateLimitedTransport,
  pollingInterval: 3000, // Poll receipt pelan-pelan agar hemat kuota RPC
});

const account1 = privateKeyToAccount(FIRST_WALLET_PRIVATE_KEY as `0x${string}`);
const account2 = privateKeyToAccount(SECOND_WALLET_PRIVATE_KEY as `0x${string}`);

const client1 = createWalletClient({
  account: account1,
  chain: arcTestnet,
  transport: rateLimitedTransport,
});

const client2 = createWalletClient({
  account: account2,
  chain: arcTestnet,
  transport: rateLimitedTransport,
});

// ─────────────────────────────────────────────────────────────
//  Pretty output helpers (ANSI colors + formatting)
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

// Session statistics tracker
const stats = {
  startedAt: Date.now(),
  jobsCompleted: 0,
  totalVolume: BigInt(0),
  totalTx: 0,
  gasSeeds: 0,
  seededVolume: BigInt(0),
  recoveredJobs: 0,
  recoveredVolume: BigInt(0),
  failures: 0,
  cycleTimesMs: [] as number[],
  lastJobId: null as bigint | null,
};

function trackTx() {
  stats.totalTx++;
}

function logStep(step: number, total: number, emoji: string, title: string) {
  console.log(
    `\n${C.bold}${C.cyan}  [${step}/${total}]${C.reset} ${emoji} ${C.bold}${title}${C.reset}`
  );
}

function logTx(hash: string, ms: number, extra = "") {
  console.log(
    `        ${C.green}✔${C.reset} confirmed in ${C.yellow}${fmtDuration(ms)}${C.reset}  ${C.gray}tx ${shortHash(hash)}${C.reset}${extra ? `  ${extra}` : ""}`
  );
}

function printSessionDashboard() {
  const uptimeMs = Date.now() - stats.startedAt;
  const avg =
    stats.cycleTimesMs.length > 0
      ? stats.cycleTimesMs.reduce((a, b) => a + b, 0) / stats.cycleTimesMs.length
      : 0;
  const best = stats.cycleTimesMs.length > 0 ? Math.min(...stats.cycleTimesMs) : 0;
  const worst = stats.cycleTimesMs.length > 0 ? Math.max(...stats.cycleTimesMs) : 0;
  const jobsPerHour = avg > 0 ? Math.round(3600000 / avg) : 0;
  const txPerMin = uptimeMs > 0 ? ((stats.totalTx / uptimeMs) * 60000).toFixed(1) : "0";

  const b = `${C.magenta}║${C.reset}`;
  console.log("");
  console.log(`  ${C.magenta}${C.bold}╔══════════════ 📊 SESSION DASHBOARD ══════════════╗${C.reset}`);
  console.log(`  ${b} ⏱  Uptime          : ${C.bold}${fmtUptime(uptimeMs)}${C.reset}`);
  console.log(`  ${b} ✅ Jobs Completed  : ${C.bold}${C.green}${stats.jobsCompleted}${C.reset}`);
  console.log(`  ${b} 💰 Total Volume    : ${C.bold}${C.green}${fmtUsdc(stats.totalVolume)}${C.reset}`);
  console.log(`  ${b} 🧾 Total TXs Sent  : ${C.bold}${stats.totalTx}${C.reset} ${C.gray}(~${txPerMin} tx/min)${C.reset}`);
  if (stats.cycleTimesMs.length > 0) {
    console.log(`  ${b} ⚡ Cycle Time      : avg ${C.bold}${fmtDuration(Math.round(avg))}${C.reset} ${C.gray}(best ${fmtDuration(best)} / worst ${fmtDuration(worst)})${C.reset}`);
    console.log(`  ${b} 🚀 Throughput      : ${C.bold}~${jobsPerHour} jobs/hour${C.reset}`);
  }
  if (stats.gasSeeds > 0) {
    console.log(`  ${b} ⛽ Gas Seeds       : ${stats.gasSeeds} (${fmtUsdc(stats.seededVolume)})`);
  }
  if (stats.recoveredJobs > 0) {
    console.log(`  ${b} 🛠  Recovered Jobs  : ${stats.recoveredJobs} (${fmtUsdc(stats.recoveredVolume)} unlocked)`);
  }
  if (stats.failures > 0) {
    console.log(`  ${b} ❌ Failures        : ${C.red}${stats.failures}${C.reset}`);
  }
  if (stats.lastJobId !== null) {
    console.log(`  ${b} 🆔 Last Job ID     : #${stats.lastJobId}`);
  }
  console.log(`  ${C.magenta}${C.bold}╚═══════════════════════════════════════════════════╝${C.reset}`);
}

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

  // 1. Get or create profiles for both addresses
  const getOrCreateProfile = async (address: string, role: "client" | "worker") => {
    const formattedAddr = address.toLowerCase();

    // Check if profile exists
    const { data: profile } = await supabase
      .from("profiles_arcworker")
      .select("id")
      .eq("wallet_address", formattedAddr)
      .maybeSingle();

    if (profile) return profile.id;

    // Create a new mock profile if it doesn't exist
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

    // 2. Insert completed job
    const title = `Onchain Job #${jobIdOnchain}`;
    const brief = `Automated cycle test job executed directly onchain. (Job ID: ${jobIdOnchain})`;
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
    } else {
      console.log(`        ${C.green}✔${C.reset} Job #${jobIdOnchain} synced to Supabase`);

      // 3. Update profiles statistics (spent / earned / completed count)
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

      console.log(`        ${C.green}✔${C.reset} Profile stats updated (client spent / provider earned)`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to sync job to database:", errorMsg);
  }
}

async function recoverStuckJobs() {
  console.log(`\n${C.blue}${C.bold}🔍 Scanning for stuck escrow jobs on-chain...${C.reset}`);
  try {
    const nextJobIdRaw = await publicClient.readContract({
      address: ERC8183_CONTRACT_ADDRESS,
      abi: escrowAbiWithNextJobId,
      functionName: "nextJobId",
    });
    const nextJobId = BigInt(nextJobIdRaw);

    // Scan last 50 jobs
    const startScan = nextJobId - BigInt(1);
    const endScan = startScan - BigInt(50) > BigInt(0) ? startScan - BigInt(50) : BigInt(1);

    console.log(`${C.gray}   Range: Job #${endScan} → #${startScan}${C.reset}`);
    for (let id = startScan; id >= endScan; id--) {
      // Jeda antar request sudah diatur global oleh rateLimitedTransport
      const job = await publicClient.readContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "jobs",
        args: [id],
      });

      const client = job[0];
      const provider = job[1];
      const fundedAmount = job[5];
      const status = job[10];

      const isUserWallet = (addr: string) =>
        addr.toLowerCase() === account1.address.toLowerCase() ||
        addr.toLowerCase() === account2.address.toLowerCase();

      // If both client and provider are user wallets, and status is active with funded funds
      if (isUserWallet(client) && isUserWallet(provider) && fundedAmount > BigInt(0)) {
        // Status: 3 = Funded, 4 = Submitted, 5 = RevisionRequested
        if (status === 3 || status === 4 || status === 5) {
          console.log(`\n${C.yellow}⚠️  Found stuck Job #${id} with ${C.bold}${fmtUsdc(fundedAmount)}${C.reset}${C.yellow} locked!${C.reset}`);

          // Determine which wallet is Client/Provider
          const isWallet1Client = client.toLowerCase() === account1.address.toLowerCase();
          const clientWallet = isWallet1Client ? client1 : client2;
          const providerWallet = isWallet1Client ? client2 : client1;

          if (status === 3 || status === 5) {
            console.log(`   🛠  [Recovery] Submitting deliverable for Job #${id}...`);
            const mockDeliverable = "0x1234567890123456789012345678901234567890123456789012345678901234" as `0x${string}`;
            const submitHash = await providerWallet.writeContract({
              address: ERC8183_CONTRACT_ADDRESS,
              abi: erc8183Abi,
              functionName: "submit",
              args: [id, mockDeliverable, "0x"],
            });
            await publicClient.waitForTransactionReceipt({ hash: submitHash });
            trackTx();
            console.log(`   ${C.green}✔${C.reset} Deliverable submitted ${C.gray}tx ${shortHash(submitHash)}${C.reset}`);
            await sleep(STAGE_DELAY);
          }

          console.log(`   🛠  [Recovery] Releasing funds (completing) Job #${id}...`);
          const mockReason = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`;
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
          console.log(`   ${C.green}✔ Job #${id} recovered — ${fmtUsdc(fundedAmount)} released to provider!${C.reset} ${C.gray}tx ${shortHash(completeHash)}${C.reset}`);

          await sleep(STAGE_DELAY);
        }
      }
    }
    console.log(`${C.green}   Scan complete — ${stats.recoveredJobs} stuck job(s) recovered.${C.reset}\n`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error during stuck jobs recovery scan:", errorMsg);
  }
}

async function main() {
  console.log(`${C.magenta}${C.bold}`);
  console.log("  ╔══════════════════════════════════════════════════╗");
  console.log("  ║      🤖  ARC WORKNET — ONCHAIN VOLUME BOT  🤖     ║");
  console.log("  ║          ERC-8183 Escrow Cycle Simulator          ║");
  console.log("  ╚══════════════════════════════════════════════════╝");
  console.log(C.reset);
  console.log(`  ${C.gray}Wallet 1        :${C.reset} ${account1.address}`);
  console.log(`  ${C.gray}Wallet 2        :${C.reset} ${account2.address}`);
  console.log(`  ${C.gray}Escrow Contract :${C.reset} ${ERC8183_CONTRACT_ADDRESS}`);
  console.log(`  ${C.gray}USDC Contract   :${C.reset} ${ARC_USDC_ADDRESS}`);
  console.log(`  ${C.gray}RPC             :${C.reset} ${ARC_RPC_URL}`);

  await recoverStuckJobs();
  
  console.log(`\n${C.yellow}⏳ Menunggu 2 detik agar RPC mereset limit IP...${C.reset}`);
  await sleep(2000);

  // Configurable Max Iterations
  const MAX_ITERATIONS = Infinity; // Set to Infinity for endless loop
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    const cycleStart = Date.now();
    console.log(`\n${C.cyan}${C.bold}┌────────────────────────────────────────────────────┐${C.reset}`);
    console.log(`${C.cyan}${C.bold}│ 🔄 CYCLE #${String(iteration).padEnd(5)} • Uptime ${fmtUptime(Date.now() - stats.startedAt)} • Done: ${String(stats.jobsCompleted).padEnd(5)}│${C.reset}`);
    console.log(`${C.cyan}${C.bold}└────────────────────────────────────────────────────┘${C.reset}`);

    // Read initial balances for both wallets to determine who should be Client
    const bal1 = await publicClient.readContract({
      address: ARC_USDC_ADDRESS,
      abi: erc20UsdcAbi,
      functionName: "balanceOf",
      args: [account1.address],
    });

    const bal2 = await publicClient.readContract({
      address: ARC_USDC_ADDRESS,
      abi: erc20UsdcAbi,
      functionName: "balanceOf",
      args: [account2.address],
    });

    console.log(`  💳 Wallet 1 ${C.gray}${shortAddr(account1.address)}${C.reset} : ${C.bold}${fmtUsdc(bal1)}${C.reset}`);
    console.log(`  💳 Wallet 2 ${C.gray}${shortAddr(account2.address)}${C.reset} : ${C.bold}${fmtUsdc(bal2)}${C.reset}`);

    const wallet1IsClient = bal1 >= bal2;
    const clientWallet = wallet1IsClient ? client1 : client2;
    const clientAccount = wallet1IsClient ? account1 : account2;
    const clientBal = wallet1IsClient ? bal1 : bal2;

    const providerWallet = wallet1IsClient ? client2 : client1;
    const providerAccount = wallet1IsClient ? account2 : account1;
    const providerBal = wallet1IsClient ? bal2 : bal1;

    console.log(`  🧑‍💼 Client (Evaluator) : ${shortAddr(clientAccount.address)}`);
    console.log(`  👷 Provider           : ${shortAddr(providerAccount.address)}`);

    // Ensure Provider has enough gas to execute submit (e.g. at least 1 USDC)
    const minGasBuffer = BigInt(1000000); // 1 USDC
    let clientBalAfterSeed = clientBal;
    let providerBalAfterSeed = providerBal;

    if (providerBal < minGasBuffer) {
      console.log(`\n  ⛽ ${C.yellow}[Gas Seeding]${C.reset} Provider low on gas (${fmtUsdc(providerBal)})`);
      const seedAmount = minGasBuffer; // Flat 1 USDC

      // Check if client can afford to seed and still have gas buffer
      const requiredClientBalance = seedAmount + BigInt(2000000) + BigInt(1000000); // seed + 2 USDC gas + 1 USDC budget
      if (clientBal >= requiredClientBalance) {
        const seedStart = Date.now();
        const seedHash = await clientWallet.writeContract({
          address: ARC_USDC_ADDRESS,
          abi: usdcAbiWithTransfer,
          functionName: "transfer",
          args: [providerAccount.address, seedAmount],
        });
        await publicClient.waitForTransactionReceipt({ hash: seedHash });
        trackTx();
        stats.gasSeeds++;
        stats.seededVolume += seedAmount;
        console.log(`     ${C.green}✔${C.reset} Seeded ${fmtUsdc(seedAmount)} in ${fmtDuration(Date.now() - seedStart)} ${C.gray}tx ${shortHash(seedHash)}${C.reset}`);

        clientBalAfterSeed = clientBal - seedAmount;
        providerBalAfterSeed = providerBal + seedAmount;
        console.log(`     ${C.gray}New balances → Client: ${fmtUsdc(clientBalAfterSeed)} | Provider: ${fmtUsdc(providerBalAfterSeed)}${C.reset}`);
      } else {
        console.log(`     ${C.red}⚠️  Client does not have enough balance to seed provider gas.${C.reset}`);
      }
    }

    // Calculate budget: usdc balance - 2 USDC (2_000_000 micro-USDC)
    const twoUsdc = BigInt(2000000);
    if (clientBalAfterSeed <= twoUsdc + BigInt(1000000)) {
      console.log(`\n  ${C.red}⚠️  Client balance too low to run this cycle (need > 3 USDC).${C.reset}`);
      console.log(`  ${C.red}Please transfer USDC to the client address and run again.${C.reset}`);
      break;
    }

    const budget = clientBalAfterSeed - twoUsdc;
    console.log(`  💵 Escrow Budget : ${C.bold}${C.green}${fmtUsdc(budget)}${C.reset} ${C.gray}(2 USDC kept for gas)${C.reset}`);

    try {
      // Step 1: Create Job
      logStep(1, 6, "📝", "createJob — registering job on escrow contract");
      let t0 = Date.now();
      const createHash = await clientWallet.writeContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "createJob",
        args: [
          providerAccount.address, // provider
          clientAccount.address,   // evaluator
          BigInt(0),                      // expiredAt (no expiration)
          "Onchain Simulation Run",// description
          "0x0000000000000000000000000000000000000000", // hook
        ],
      });
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      trackTx();

      // Extract jobId from event logs
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
          // Skip unrelated logs
        }
      }

      if (jobId === undefined) {
        throw new Error("Could not find JobCreated event log in tx receipt.");
      }
      logTx(createHash, Date.now() - t0, `${C.bold}Job ID #${jobId}${C.reset} ${C.gray}(block ${createReceipt.blockNumber})${C.reset}`);
      stats.lastJobId = jobId;

      await sleep(STAGE_DELAY);

      // Step 2: Set Budget
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

      // Step 3: Approve Escrow contract to spend client USDC
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

      // Poll allowance to ensure RPC node has synced the state before calling fund
      let allowanceSynced = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        const currentAllowance = await publicClient.readContract({
          address: ARC_USDC_ADDRESS,
          abi: erc20UsdcAbi,
          functionName: "allowance",
          args: [clientAccount.address, ERC8183_CONTRACT_ADDRESS],
        });
        if (currentAllowance >= budget) {
          allowanceSynced = true;
          break;
        }
        await sleep(1000); // Jangan mem-bombardir RPC!
      }
      if (!allowanceSynced) {
        console.warn(`        ${C.yellow}⚠️  Allowance might not be synced yet on the RPC node.${C.reset}`);
      }

      await sleep(STAGE_DELAY);

      // Step 4: Fund the Job
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

      // Step 5: Submit Job
      logStep(5, 6, "📦", "submit — provider delivering the work");
      t0 = Date.now();
      const deliverableHash = "0x1234567890123456789012345678901234567890123456789012345678901234" as `0x${string}`;
      const submitHash = await providerWallet.writeContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "submit",
        args: [jobId, deliverableHash, "0x"],
      });
      await publicClient.waitForTransactionReceipt({ hash: submitHash });
      trackTx();
      logTx(submitHash, Date.now() - t0);

      await sleep(STAGE_DELAY);

      // Step 6: Complete Job (Release Funds)
      logStep(6, 6, "🏁", "complete — releasing funds to provider");
      t0 = Date.now();
      const completionReasonHash = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`;
      const completeHash = await clientWallet.writeContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "complete",
        args: [jobId, completionReasonHash, "0x"],
      });
      await publicClient.waitForTransactionReceipt({ hash: completeHash });
      trackTx();
      logTx(completeHash, Date.now() - t0);

      await sleep(STAGE_DELAY);

      // Read final balances
      const clientBalFinal = await publicClient.readContract({
        address: ARC_USDC_ADDRESS,
        abi: erc20UsdcAbi,
        functionName: "balanceOf",
        args: [clientAccount.address],
      });

      const providerBalFinal = await publicClient.readContract({
        address: ARC_USDC_ADDRESS,
        abi: erc20UsdcAbi,
        functionName: "balanceOf",
        args: [providerAccount.address],
      });

      const cycleMs = Date.now() - cycleStart;

      // Update session stats
      stats.jobsCompleted++;
      stats.totalVolume += budget;
      stats.cycleTimesMs.push(cycleMs);

      console.log(`\n  ${C.green}${C.bold}🎉 JOB #${jobId} COMPLETE${C.reset} ${C.gray}— full escrow cycle in ${C.reset}${C.yellow}${fmtDuration(cycleMs)}${C.reset}`);
      console.log(`  ${C.gray}├${C.reset} 💸 Volume moved    : ${C.bold}${fmtUsdc(budget)}${C.reset}`);
      console.log(`  ${C.gray}├${C.reset} 🧑‍💼 Client balance  : ${fmtUsdc(clientBalFinal)} ${C.red}(${formatUnits(clientBalFinal - clientBal, 6)})${C.reset}`);
      console.log(`  ${C.gray}└${C.reset} 👷 Provider balance: ${fmtUsdc(providerBalFinal)} ${C.green}(+${formatUnits(providerBalFinal - providerBal, 6)})${C.reset}`);

      // Sync job and update user statistics in Supabase
      console.log(`\n  ${C.blue}🗄  Syncing to database...${C.reset}`);
      await syncJobToDatabase({
        clientAddress: clientAccount.address,
        providerAddress: providerAccount.address,
        budgetUnits: budget,
        jobIdOnchain: jobId,
        createTxHash: createHash,
        completeTxHash: completeHash,
      });

      // Show running session totals after every cycle
      printSessionDashboard();

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      stats.failures++;
      console.error(`\n  ${C.red}❌ Error in cycle #${iteration}: ${errorMsg}${C.reset}`);

      // Rate limit lolos dari semua retry transport → cooldown lalu lanjut,
      // jangan matikan bot. recoverStuckJobs di start berikutnya akan
      // menyelamatkan job yang tertinggal di tengah cycle ini.
      if (isRateLimitError(err)) {
        const cooldownMs = 60000;
        console.log(`  ${C.yellow}🧊 Cooling down ${cooldownMs / 1000}s sebelum cycle berikutnya...${C.reset}`);
        await sleep(cooldownMs);
        continue;
      }
      break;
    }
  }

  console.log(`\n${C.magenta}${C.bold}  ╔═══════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.magenta}${C.bold}  ║               🏁 SIMULATION FINISHED               ║${C.reset}`);
  console.log(`${C.magenta}${C.bold}  ╚═══════════════════════════════════════════════════╝${C.reset}`);
  printSessionDashboard();
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
