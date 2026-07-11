import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem/utils";

// --- Resolve Paths & Load Environment ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const firstEq = trimmed.indexOf("=");
      if (firstEq !== -1) {
        const key = trimmed.slice(0, firstEq).trim();
        const val = trimmed.slice(firstEq + 1).trim().replace(/^['"]|['"]$/g, "");
        env[key] = val;
      }
    }
  });
}

// Config variables
const BASE_URL = process.env.API_URL || env.API_URL || "https://worknet.rizzgm.xyz";
const ADMIN_API_SECRET = env.ADMIN_API_SECRET || "";
const CLIENT_KEY = env.CYPRESS_TEST_CLIENT_PRIVATE_KEY || "";
const WORKER_KEY = env.CYPRESS_TEST_WORKER_PRIVATE_KEY || "";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
});

console.log("==========================================");
console.log("   Arc WorkNet API Performance Tester     ");
console.log("==========================================");
console.log(`Target URL: ${BASE_URL}\n`);

// Helper to authenticate and get cookie
async function getAuthCookie(privateKey) {
  if (!privateKey) return null;
  try {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    // 1. Get Nonce
    const nonceRes = await fetch(`${BASE_URL}/api/wallet/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: account.address, chainId: 5042002 }),
    });
    if (!nonceRes.ok) throw new Error(`Nonce request failed: ${nonceRes.statusText}`);
    const { message, nonce } = await nonceRes.json();

    // 2. Sign message
    const signature = await client.signMessage({ message });

    // 3. Verify signature
    const verifyRes = await fetch(`${BASE_URL}/api/wallet/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: account.address,
        chainId: 5042002,
        nonce,
        message,
        signature,
        timezone: "Asia/Jakarta",
      }),
    });
    if (!verifyRes.ok) throw new Error(`Verification failed: ${verifyRes.statusText}`);

    const rawCookie = verifyRes.headers.get("set-cookie") || "";
    const cookie = rawCookie.split(";")[0];
    const { profile } = await verifyRes.json();

    return { cookie, profile, address: account.address };
  } catch (error) {
    console.error(`Authentication error: ${error.message}`);
    return null;
  }
}

async function run() {
  console.log("Authenticating test accounts...");
  const clientAuth = await getAuthCookie(CLIENT_KEY);
  const workerAuth = await getAuthCookie(WORKER_KEY);

  if (clientAuth) {
    console.log(`[Client] Authenticated successfully: ${clientAuth.address} (Profile ID: ${clientAuth.profile.id})`);
  } else {
    console.log("[Client] Credentials missing or auth failed. Client-gated endpoints will return 401.");
  }

  if (workerAuth) {
    console.log(`[Worker] Authenticated successfully: ${workerAuth.address} (Profile ID: ${workerAuth.profile.id})`);
  } else {
    console.log("[Worker] Credentials missing or auth failed. Worker-gated endpoints will return 401.");
  }
  console.log("");

  // Retrieve public bootstrap state to resolve dynamic IDs
  console.log("Fetching bootstrap state to fetch dynamic entities...");
  const bootStart = performance.now();
  let bootstrapData = null;
  try {
    const res = await fetch(`${BASE_URL}/api/bootstrap`);
    bootstrapData = await res.json();
    console.log(`Bootstrap fetched in ${(performance.now() - bootStart).toFixed(2)}ms.`);
  } catch (error) {
    console.error(`Warning: Failed to fetch bootstrap state: ${error.message}. Dynamic endpoint testing might fail.`);
  }

  // Pick entities for dynamic testing
  const activeJobs = bootstrapData?.state?.jobs || [];
  const sampleJob = activeJobs.find(j => j.status === "funded" || j.status === "open") || activeJobs[0];
  const sampleJobId = sampleJob?.id || "00000000-0000-0000-0000-000000000000";

  console.log(`Using Job ID: ${sampleJobId} (${sampleJob?.title || "No jobs available"}) for gated endpoints.\n`);

  // Build the list of endpoints to test
  const testCases = [
    // --- Public / Authentication ---
    {
      name: "GET /api/bootstrap (Public State)",
      path: "/api/bootstrap",
      method: "GET",
      auth: "none",
    },
    {
      name: "POST /api/wallet/nonce (Request Nonce)",
      path: "/api/wallet/nonce",
      method: "POST",
      body: { address: clientAuth?.address || "0x0000000000000000000000000000000000000000", chainId: 5042002 },
      auth: "none",
    },
    {
      name: "POST /api/wallet/verify (SIWE Verify)",
      path: "/api/wallet/verify",
      method: "POST",
      body: {},
      auth: "none",
    },
    {
      name: "POST /api/wallet/logout (Clear Session)",
      path: "/api/wallet/logout",
      method: "POST",
      auth: "none",
    },

    // --- Private Bootstrap ---
    {
      name: "GET /api/bootstrap/private (Worker Private State)",
      path: "/api/bootstrap/private",
      method: "GET",
      auth: "worker",
    },
    {
      name: "GET /api/bootstrap/private (Client Private State)",
      path: "/api/bootstrap/private",
      method: "GET",
      auth: "client",
    },

    // --- Profile & Agents ---
    {
      name: "PATCH /api/profile (Update Profile to Worker)",
      path: "/api/profile",
      method: "PATCH",
      body: { role: "worker" },
      auth: "worker",
    },
    {
      name: "POST /api/agents/register (Register Bot/Agent)",
      path: "/api/agents/register",
      method: "POST",
      body: {},
      auth: "worker",
    },

    // --- Jobs Board ---
    {
      name: "POST /api/jobs (Create Job)",
      path: "/api/jobs",
      method: "POST",
      body: {},
      auth: "client",
    },
    {
      name: "POST /api/jobs/upload-task (Upload task PDF)",
      path: "/api/jobs/upload-task",
      method: "POST",
      body: { fileName: "test-task.pdf", contentType: "application/pdf" },
      auth: "client",
    },
    {
      name: "GET /api/jobs/[id]/task-file (Task file download)",
      path: `/api/jobs/${sampleJobId}/task-file`,
      method: "GET",
      auth: "worker",
    },

    // --- Applications / Proposals ---
    {
      name: "POST /api/jobs/[id]/apply (Apply to Job)",
      path: `/api/jobs/${sampleJobId}/apply`,
      method: "POST",
      body: {},
      auth: "worker",
    },
    {
      name: "POST /api/jobs/[id]/accept-application (Accept proposal)",
      path: `/api/jobs/${sampleJobId}/accept-application`,
      method: "POST",
      body: {},
      auth: "client",
    },

    // --- Onchain Triggers (verification checks) ---
    {
      name: "POST /api/jobs/[id]/create-onchain (Onchain sync)",
      path: `/api/jobs/${sampleJobId}/create-onchain`,
      method: "POST",
      body: {},
      auth: "client",
    },
    {
      name: "POST /api/jobs/[id]/set-budget (Onchain budget set)",
      path: `/api/jobs/${sampleJobId}/set-budget`,
      method: "POST",
      body: {},
      auth: "client",
    },
    {
      name: "POST /api/jobs/[id]/fund (Onchain funding verify)",
      path: `/api/jobs/${sampleJobId}/fund`,
      method: "POST",
      body: {},
      auth: "client",
    },

    // --- Deliverables ---
    {
      name: "POST /api/jobs/[id]/deliverable-upload-url (Request upload token)",
      path: `/api/jobs/${sampleJobId}/deliverable-upload-url`,
      method: "POST",
      body: {},
      auth: "worker",
    },
    {
      name: "GET /api/jobs/[id]/deliverable (Download deliverable)",
      path: `/api/jobs/${sampleJobId}/deliverable`,
      method: "GET",
      auth: "client",
    },
    {
      name: "POST /api/jobs/[id]/submit (Sync submission)",
      path: `/api/jobs/${sampleJobId}/submit`,
      method: "POST",
      body: {},
      auth: "worker",
    },

    // --- Review & Disputes ---
    {
      name: "POST /api/jobs/[id]/complete (Complete and release escrow)",
      path: `/api/jobs/${sampleJobId}/complete`,
      method: "POST",
      body: {},
      auth: "client",
    },
    {
      name: "POST /api/jobs/[id]/reject (Request revision)",
      path: `/api/jobs/${sampleJobId}/reject`,
      method: "POST",
      body: {},
      auth: "client",
    },

    // --- Chat & Job Invites ---
    {
      name: "GET /api/jobs/[id]/messages (Get chat messages)",
      path: `/api/jobs/${sampleJobId}/messages`,
      method: "GET",
      auth: "worker",
    },
    {
      name: "POST /api/jobs/[id]/messages (Send chat message)",
      path: `/api/jobs/${sampleJobId}/messages`,
      method: "POST",
      body: { body: "Performance Test" },
      auth: "worker",
    },
    {
      name: "GET /api/jobs/[id]/invitations (Get job invitations)",
      path: `/api/jobs/${sampleJobId}/invitations`,
      method: "GET",
      auth: "client",
    },
    {
      name: "POST /api/jobs/[id]/invitations (Invite worker)",
      path: `/api/jobs/${sampleJobId}/invitations`,
      method: "POST",
      body: {},
      auth: "client",
    },

    // --- Bookmarks / Saved Jobs ---
    {
      name: "GET /api/saved-jobs (Get saved jobs list)",
      path: "/api/saved-jobs",
      method: "GET",
      auth: "worker",
    },
    {
      name: "POST /api/saved-jobs (Bookmark a job)",
      path: "/api/saved-jobs",
      method: "POST",
      body: { jobId: sampleJobId },
      auth: "worker",
    },
    {
      name: "DELETE /api/saved-jobs (Remove bookmarked job)",
      path: `/api/saved-jobs?jobId=${sampleJobId}`,
      method: "DELETE",
      auth: "worker",
    },

    // --- Global Invitations ---
    {
      name: "GET /api/invitations (Get worker invitations)",
      path: "/api/invitations",
      method: "GET",
      auth: "worker",
    },
    {
      name: "PATCH /api/invitations/[id] (Respond to invite)",
      path: `/api/invitations/${sampleJobId}`,
      method: "PATCH",
      body: { status: "accepted" },
      auth: "worker",
    },

    // --- Notifications ---
    {
      name: "POST /api/notifications/[id]/read (Mark notification read)",
      path: `/api/notifications/${sampleJobId}/read`,
      method: "POST",
      auth: "worker",
    },
    {
      name: "POST /api/notifications/read-all (Mark all read)",
      path: "/api/notifications/read-all",
      method: "POST",
      auth: "worker",
    },

    // --- Overlay Status ---
    {
      name: "POST /api/applications/[id]/overlay (Save overlay status)",
      path: `/api/applications/${sampleJobId}/overlay`,
      method: "POST",
      body: { status: "rejected", reason: "Perf Test" },
      auth: "worker",
    },

    // --- Admin Endpoints ---
    {
      name: "POST /api/indexer/backfill (Admin Sync Indexer)",
      path: "/api/indexer/backfill",
      method: "POST",
      headers: { "x-arc-worknet-secret": ADMIN_API_SECRET },
      auth: "none",
    },

    // --- Circle Webhooks ---
    {
      name: "POST /api/webhooks/circle/events (Circle Webhook)",
      path: "/api/webhooks/circle/events",
      method: "POST",
      headers: { "x-arc-worknet-secret": env.CIRCLE_WEBHOOK_SECRET || "" },
      body: {},
      auth: "none",
    },
  ];

  const results = [];

  for (const tc of testCases) {
    const headers = { "Content-Type": "application/json", ...tc.headers };

    // Apply appropriate cookie based on auth level
    if (tc.auth === "client" && clientAuth) {
      headers["Cookie"] = clientAuth.cookie;
    } else if (tc.auth === "worker" && workerAuth) {
      headers["Cookie"] = workerAuth.cookie;
    }

    const fetchOptions = {
      method: tc.method,
      headers,
    };

    if (tc.body) {
      fetchOptions.body = JSON.stringify(tc.body);
    }

    console.log(`Testing: ${tc.name}...`);
    const start = performance.now();
    let status = 0;
    let sizeBytes = 0;
    let errMessage = null;

    try {
      const res = await fetch(`${BASE_URL}${tc.path}`, fetchOptions);
      status = res.status;
      const text = await res.text();
      sizeBytes = Buffer.byteLength(text, "utf8");
    } catch (e) {
      errMessage = e.message;
    }
    const end = performance.now();
    const latency = end - start;

    results.push({
      name: tc.name,
      path: tc.path,
      method: tc.method,
      auth: tc.auth,
      status,
      latencyMs: latency,
      sizeBytes,
      error: errMessage,
    });
  }

  // --- Display Results ---
  console.log("\n========================================================");
  console.log("                API LATENCY TEST RESULTS                ");
  console.log("========================================================\n");

  console.log("| Endpoint | Method | Auth | Status | Latency (ms) | Size (Bytes) | Result |");
  console.log("|---|---|---|---|---|---|---|");

  results.forEach((r) => {
    let speedLabel = "🟢 OK";
    if (r.latencyMs > 800) {
      speedLabel = "🔴 VERY SLOW";
    } else if (r.latencyMs > 300) {
      speedLabel = "🟡 SLOW";
    }
    if (r.error) speedLabel = `❌ ERR: ${r.error}`;

    const cleanName = r.name.padEnd(50, " ").slice(0, 50);
    console.log(
      `| ${cleanName} | ${r.method.padEnd(6)} | ${r.auth.padEnd(6)} | ${r.status} | ${r.latencyMs.toFixed(2).padStart(8)}ms | ${r.sizeBytes.toString().padStart(8)} B | ${speedLabel} |`
    );
  });

  console.log("\nRecommendations:");
  const slowEndpoints = results.filter((r) => r.latencyMs > 300);
  if (slowEndpoints.length === 0) {
    console.log("✅ All tested endpoints responded in under 300ms!");
  } else {
    console.log(`⚠️ Detected ${slowEndpoints.length} slow endpoints (>300ms):`);
    slowEndpoints.forEach((r) => {
      console.log(`   - ${r.name} (${r.latencyMs.toFixed(0)}ms)`);
    });
  }
  console.log("\nTest run finished.");
}

run().catch((e) => console.error("Test execution failed: ", e));
