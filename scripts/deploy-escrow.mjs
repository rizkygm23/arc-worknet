#!/usr/bin/env node
/**
 * Deploy ArcWorknetEscrow to Arc Testnet via Circle Contracts.
 *
 * Replaces the manual Remix flow: compiles nothing itself — it consumes the
 * solc build artifact at contracts/out/ArcWorknetEscrow.json (see AGENTS.md:
 * `npx solc@0.8.24 --bin --abi --optimize --output-dir contracts/out
 * contracts/ArcWorknetEscrow.sol`), then:
 *   1. encrypts the entity secret,
 *   2. POSTs /v1/w3s/contracts/deploy on ARC-TESTNET,
 *   3. polls the deployment transaction to completion,
 *   4. resolves the deployed contract address.
 *
 * Required env:
 *   CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET   Circle server API credentials
 *   DEPLOYER_WALLET_ID                     developer-controlled wallet on ARC-TESTNET
 *   ESCROW_FEE_RECIPIENT_ADDRESS           platform fee recipient (falls back to
 *                                          PLATFORM_FEE_RECIPIENT_ADDRESS)
 * Optional env:
 *   ESCROW_OWNER_ADDRESS                   escrow owner (falls back to the deployer
 *                                          wallet's address) — holds resolveDispute,
 *                                          setFeeRecipient, transferOwner
 *   ESCROW_PLATFORM_FEE_BPS                default 100 (1%)
 *
 * Usage: node scripts/deploy-escrow.mjs
 * After deployment, set ERC8183_CONTRACT_ADDRESS to the printed address.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Plain `node` does not load .env (only Next.js does). Parse it manually —
// same pattern as scripts/test-api-perf.mjs. Shell env wins over .env.
{
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

const CIRCLE_API_BASE_URL = "https://api.circle.com";
const BLOCKCHAIN = "ARC-TESTNET";
const FEE_LEVEL = "MEDIUM";
// Native USDC on Arc (ERC-20 interface) — first constructor argument of the escrow.
const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
};

const apiKey = required("CIRCLE_API_KEY");
const entitySecret = required("CIRCLE_ENTITY_SECRET");
const walletId = required("DEPLOYER_WALLET_ID");
const feeRecipient =
  process.env.ESCROW_FEE_RECIPIENT_ADDRESS ||
  process.env.PLATFORM_FEE_RECIPIENT_ADDRESS ||
  required("ESCROW_FEE_RECIPIENT_ADDRESS");
const platformFeeBps = process.env.ESCROW_PLATFORM_FEE_BPS ?? process.env.PLATFORM_FEE_BPS ?? "100";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const artifactPath = path.resolve(scriptDir, "../contracts/out/ArcWorknetEscrow.json");
if (!fs.existsSync(artifactPath)) {
  console.error(
    `Build artifact not found: ${artifactPath}\nCompile first:\n  npx solc@0.8.24 --bin --abi --optimize --output-dir contracts/out contracts/ArcWorknetEscrow.sol`,
  );
  process.exit(1);
}
const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
if (!bytecode || bytecode === "0x") {
  console.error("Compiled bytecode is empty — check the solc build.");
  process.exit(1);
}

async function circleFetch(path, init = {}) {
  const res = await fetch(`${CIRCLE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Circle ${init.method ?? "GET"} ${path} failed (${res.status}): ${payload.message ?? "unknown"}`);
  }
  return payload;
}

async function freshEntitySecretCiphertext() {
  const { data } = await circleFetch("/v1/w3s/config/entity/publicKey");
  const publicKeyPem = data?.publicKey;
  if (!publicKeyPem) throw new Error("Circle public key not found.");

  const encrypted = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(entitySecret, "hex"),
  );
  return encrypted.toString("base64");
}

async function deployerWalletAddress() {
  const res = await circleFetch(`/v1/w3s/wallets/${walletId}`);
  const wallet = res.data?.wallet ?? res.data;
  if (!wallet?.address) throw new Error(`Could not resolve deployer wallet address for ${walletId}`);
  return wallet.address;
}

async function main() {
  console.log(`Deploying ArcWorknetEscrow to ${BLOCKCHAIN} from wallet ${walletId}`);
  console.log(`Fee recipient: ${feeRecipient} @ ${platformFeeBps} bps`);

  // v2.1: owner is an explicit constructor arg — Circle deploys through its
  // own relayer, so msg.sender inside the constructor is never our wallet.
  const ownerAddress = process.env.ESCROW_OWNER_ADDRESS || (await deployerWalletAddress());
  console.log(`Owner (resolveDispute/setFeeRecipient/transferOwner): ${ownerAddress}`);

  const entitySecretCiphertext = await freshEntitySecretCiphertext();

  const deployRes = await circleFetch("/v1/w3s/contracts/deploy", {
    method: "POST",
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      name: "ArcWorknetEscrow",
      // NOTE: the REST schema for /v1/w3s/contracts/deploy rejects a
      // `description` field ("API parameter invalid") despite SDK examples
      // showing one — keep the body minimal.
      walletId,
      blockchain: BLOCKCHAIN,
      abiJson: JSON.stringify(abi),
      bytecode,
      constructorParameters: [ARC_USDC_ADDRESS, feeRecipient, platformFeeBps, ownerAddress],
      feeLevel: FEE_LEVEL,
      entitySecretCiphertext,
    }),
  });

  const deployData = deployRes.data ?? deployRes;
  // REST returns singular `contractId`; the SDK normalizes to `contractIds[]`.
  const contractId = deployData.contractId ?? deployData.contractIds?.[0];
  const transactionId = deployData.transactionId;
  if (!contractId || !transactionId) {
    throw new Error(`Unexpected deploy response: ${JSON.stringify(deployRes).slice(0, 400)}`);
  }
  console.log(`Deployment initiated. contractId=${contractId} transactionId=${transactionId}`);

  // Poll the deployment transaction to completion.
  let state = "INITIATED";
  let txHash;
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const txRes = await circleFetch(`/v1/w3s/transactions/${transactionId}`);
    const tx = txRes.data?.transaction ?? txRes.data ?? {};
    state = tx.state ?? "UNKNOWN";
    txHash = tx.txHash ?? txHash;
    console.log(`  state=${state}`);
    if (["COMPLETE", "CONFIRMED", "FAILED"].includes(state)) break;
  }
  if (state !== "COMPLETE" && state !== "CONFIRMED") {
    throw new Error(`Deployment did not complete (state=${state}). Check the Console and retry.`);
  }

  // Resolve the onchain contract address.
  const contractRes = await circleFetch(`/v1/w3s/contracts/${contractId}`);
  const contract = contractRes.data?.contract ?? contractRes.data ?? {};
  const contractAddress = contract.contractAddress;

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log(`contractAddress: ${contractAddress ?? "(resolve via GET /v1/w3s/contracts/" + contractId + ")"}`);
  console.log(`txHash:          ${txHash ?? "(see transactionId)"}`);
  console.log("\nNext step (manual cutover): set ERC8183_CONTRACT_ADDRESS to the address above,");
  console.log("then verify on the Arc explorer before directing traffic at the new escrow.");
}

main().catch((err) => {
  console.error("Deploy failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
