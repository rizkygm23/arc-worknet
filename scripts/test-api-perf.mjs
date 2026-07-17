import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
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

// If CYPRESS keys are missing in env, generate fresh ones so we always have valid, working credentials
const CLIENT_KEY = env.CYPRESS_TEST_CLIENT_PRIVATE_KEY || generatePrivateKey();
const WORKER_KEY = env.CYPRESS_TEST_WORKER_PRIVATE_KEY || generatePrivateKey();

// Load Testing Config
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "10", 10); // Number of Virtual Users (VUs)
const DURATION_SECONDS = parseInt(process.env.DURATION || "10", 10); // Run duration in seconds

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
});

console.log("========================================================");
console.log("       WorkNet professional API Load Tester         ");
console.log("========================================================");
console.log(`Target URL:     ${BASE_URL}`);
console.log(`Virtual Users:  ${CONCURRENCY} VUs`);
console.log(`Duration:       ${DURATION_SECONDS}s`);
console.log("========================================================\n");

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

// Helper to ensure profile has correct role
async function ensureRole(auth, role) {
  if (!auth) return;
  try {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": auth.cookie,
      },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      console.log(`[Auth] Role for ${auth.address} successfully set/verified to "${role}".`);
      // Update local profile role cache
      auth.profile.role = role;
    } else {
      const errText = await res.text();
      console.warn(`[Auth] Warning: Could not set role to "${role}": ${errText}`);
    }
  } catch (e) {
    console.error(`[Auth] Error setting role: ${e.message}`);
  }
}

// Stats helper
const stats = {};

function initStats(tcName) {
  if (!stats[tcName]) {
    stats[tcName] = {
      name: tcName,
      total: 0,
      success: 0,
      errors: 0,
      latencies: [],
    };
  }
}

function recordResult(tcName, latency, isSuccess) {
  initStats(tcName);
  stats[tcName].total++;
  if (isSuccess) {
    stats[tcName].success++;
  } else {
    stats[tcName].errors++;
  }
  stats[tcName].latencies.push(latency);
}

function calculatePercentile(sortedArr, percentile) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.ceil((percentile / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, idx)];
}

async function run() {
  console.log("Authenticating test accounts...");
  const clientAuth = await getAuthCookie(CLIENT_KEY);
  const workerAuth = await getAuthCookie(WORKER_KEY);

  if (clientAuth) {
    console.log(`[Client] Authenticated successfully: ${clientAuth.address} (Profile ID: ${clientAuth.profile.id})`);
    await ensureRole(clientAuth, "client");
  } else {
    console.log("[Client] Authentication failed.");
  }

  if (workerAuth) {
    console.log(`[Worker] Authenticated successfully: ${workerAuth.address} (Profile ID: ${workerAuth.profile.id})`);
    await ensureRole(workerAuth, "worker");
  } else {
    console.log("[Worker] Authentication failed.");
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

  const sampleApplication = bootstrapData?.state?.applications?.[0];
  const sampleApplicationId = sampleApplication?.id || "00000000-0000-0000-0000-000000000000";

  const sampleSubmission = bootstrapData?.state?.submissions?.[0];
  const sampleSubmissionId = sampleSubmission?.id || "00000000-0000-0000-0000-000000000000";

  console.log(`Using Job ID: ${sampleJobId} (${sampleJob?.title || "No jobs available"}) for gated endpoints.\n`);

  // Build the list of endpoints to test with valid payloads to bypass schema validation
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
      bodyBuilder: async () => ({ address: clientAuth?.address || "0x0000000000000000000000000000000000000000", chainId: 5042002 }),
      auth: "none",
    },
    {
      name: "POST /api/wallet/verify (SIWE Verify)",
      path: "/api/wallet/verify",
      method: "POST",
      bodyBuilder: async () => {
        const account = privateKeyToAccount(generatePrivateKey());
        const client = createWalletClient({ account, chain: arcTestnet, transport: http() });
        const nonceRes = await fetch(`${BASE_URL}/api/wallet/nonce`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: account.address, chainId: 5042002 }),
        });
        const { message, nonce } = await nonceRes.json();
        const signature = await client.signMessage({ message });
        return {
          address: account.address,
          chainId: 5042002,
          nonce,
          message,
          signature,
          timezone: "Asia/Jakarta",
        };
      },
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
      bodyBuilder: async () => ({ role: "worker" }),
      auth: "worker",
    },

    // --- Jobs Board ---
    {
      name: "POST /api/jobs (Create Job)",
      path: "/api/jobs",
      method: "POST",
      bodyBuilder: async (auth) => ({
        clientProfileId: auth?.profile?.id || "00000000-0000-0000-0000-000000000000",
        title: `Job ${Math.random().toString(36).substring(7)}`,
        brief: "Programmatic load test job description.",
        acceptanceCriteria: "Must compile cleanly.",
        deliverableFormat: "Code repo URL",
        category: "Software",
        tags: ["Test"],
        budgetUsdcUnits: 10000000,
        actorType: "human",
      }),
      auth: "client",
    },
    {
      name: "POST /api/jobs/upload-task (Upload task PDF)",
      path: "/api/jobs/upload-task",
      method: "POST",
      bodyBuilder: async () => ({ fileName: "test-task.pdf", contentType: "application/pdf" }),
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
      bodyBuilder: async (auth) => ({
        applicantProfileId: auth?.profile?.id || "00000000-0000-0000-0000-000000000000",
        actorType: "human",
        pitch: "Experienced with EVM smart contracts.",
        proposedBudgetUsdcUnits: 10000000,
      }),
      auth: "worker",
    },
    {
      name: "POST /api/jobs/[id]/accept-application (Accept proposal)",
      path: `/api/jobs/${sampleJobId}/accept-application`,
      method: "POST",
      bodyBuilder: async () => ({ applicationId: sampleApplicationId }),
      auth: "client",
    },

    // --- Deliverables ---
    {
      name: "POST /api/jobs/[id]/deliverable-upload-url (Request upload token)",
      path: `/api/jobs/${sampleJobId}/deliverable-upload-url`,
      method: "POST",
      bodyBuilder: async () => ({ fileName: "delivery.zip", contentType: "application/zip" }),
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
      bodyBuilder: async (auth) => ({
        submitterProfileId: auth?.profile?.id || "00000000-0000-0000-0000-000000000000",
        notes: "Submission code.",
        deliverableUrl: "https://github.com/arc",
        deliverablePayload: {},
        deliverableHashBytes32: "0x1111111111111111111111111111111111111111111111111111111111111111",
        submitTxHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
      }),
      auth: "worker",
    },

    // --- Review & Disputes ---
    {
      name: "POST /api/jobs/[id]/complete (Complete and release escrow)",
      path: `/api/jobs/${sampleJobId}/complete`,
      method: "POST",
      bodyBuilder: async (auth) => ({
        reviewerProfileId: auth?.profile?.id || "00000000-0000-0000-0000-000000000000",
        submissionId: sampleSubmissionId,
        rating: 5,
        reviewText: "Great delivery.",
        reasonHashBytes32: "0x3333333333333333333333333333333333333333333333333333333333333333",
        reviewTxHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
        reviewTxMethod: "complete",
        decision: "approve",
      }),
      auth: "client",
    },
    {
      name: "POST /api/jobs/[id]/reject (Request revision)",
      path: `/api/jobs/${sampleJobId}/reject`,
      method: "POST",
      bodyBuilder: async (auth) => ({
        reviewerProfileId: auth?.profile?.id || "00000000-0000-0000-0000-000000000000",
        submissionId: sampleSubmissionId,
        reasonText: "Please make final touch-ups.",
        reasonHashBytes32: "0x5555555555555555555555555555555555555555555555555555555555555555",
        rejectTxHash: "0x6666666666666666666666666666666666666666666666666666666666666666",
      }),
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
      bodyBuilder: async () => ({ jobId: sampleJobId }),
      auth: "worker",
    },

    // --- Global Invitations ---
    {
      name: "GET /api/invitations (Get worker invitations)",
      path: "/api/invitations",
      method: "GET",
      auth: "worker",
    },
  ];

  console.log(`Starting load test with ${CONCURRENCY} VUs for ${DURATION_SECONDS} seconds...\n`);

  const startTime = Date.now();
  const endTime = startTime + DURATION_SECONDS * 1000;

  // Run a single Virtual User loop
  async function runVU(vuId) {
    while (Date.now() < endTime) {
      // Pick a random test case
      const tc = testCases[Math.floor(Math.random() * testCases.length)];

      const auth = tc.auth === "client" ? clientAuth : (tc.auth === "worker" ? workerAuth : null);

      const headers = { "Content-Type": "application/json", ...tc.headers };
      if (auth) {
        headers["Cookie"] = auth.cookie;
      }

      const fetchOptions = {
        method: tc.method,
        headers,
      };

      if (tc.bodyBuilder) {
        try {
          const bodyObj = await tc.bodyBuilder(auth);
          fetchOptions.body = JSON.stringify(bodyObj);
        } catch (e) {
          // fallback
        }
      }

      const start = performance.now();
      let isSuccess = false;
      try {
        const res = await fetch(`${BASE_URL}${tc.path}`, fetchOptions);
        await res.text(); // consume body
        isSuccess = res.ok;
      } catch (e) {
        isSuccess = false;
      }
      const latency = performance.now() - start;

      recordResult(tc.name, latency, isSuccess);
    }
  }

  // Spawn all VUs concurrently
  const vuPromises = Array.from({ length: CONCURRENCY }).map((_, idx) => runVU(idx + 1));
  await Promise.all(vuPromises);

  const testDurationMs = Date.now() - startTime;
  const totalRequests = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const totalSuccess = Object.values(stats).reduce((sum, s) => sum + s.success, 0);
  const totalErrors = Object.values(stats).reduce((sum, s) => sum + s.errors, 0);
  const rps = (totalRequests / (testDurationMs / 1000)).toFixed(2);

  // --- Display Results ---
  console.log("\n============================================================================================");
  console.log("                                  K6-STYLE LOAD TEST SUMMARY                                ");
  console.log("============================================================================================\n");

  console.log(`  scenarios: (100%) ${CONCURRENCY} VUs for ${DURATION_SECONDS}s`);
  console.log(`  http_reqs..................: ${totalRequests} total`);
  console.log(`  http_req_failed............: ${((totalErrors / totalRequests) * 100).toFixed(2)}% (errors: ${totalErrors} / success: ${totalSuccess})`);
  console.log(`  throughput.................: ${rps} reqs/s`);
  console.log(`  total duration.............: ${(testDurationMs / 1000).toFixed(2)}s\n`);

  console.log("============================================================================================");
  console.log("| Endpoint                                            | Reqs | Success % | p50 (ms) | p90 (ms) | p95 (ms) |");
  console.log("============================================================================================");

  Object.values(stats).forEach((s) => {
    // Sort latencies to compute percentiles
    s.latencies.sort((a, b) => a - b);
    const p50 = calculatePercentile(s.latencies, 50);
    const p90 = calculatePercentile(s.latencies, 90);
    const p95 = calculatePercentile(s.latencies, 95);
    const successRate = ((s.success / s.total) * 100).toFixed(1) + "%";

    const cleanName = s.name.padEnd(52, " ").slice(0, 52);
    const cleanTotal = s.total.toString().padStart(4);
    const cleanSuccess = successRate.padStart(9);
    const cleanP50 = p50.toFixed(1).padStart(8) + "ms";
    const cleanP90 = p90.toFixed(1).padStart(8) + "ms";
    const cleanP95 = p95.toFixed(1).padStart(8) + "ms";

    console.log(`| ${cleanName} | ${cleanTotal} | ${cleanSuccess} | ${cleanP50} | ${cleanP90} | ${cleanP95} |`);
  });

  console.log("============================================================================================");
  console.log("\nTest run finished.");
}

run().catch((e) => console.error("Test execution failed: ", e));
