import { createPublicClient, http } from "viem";
import { arcTestnet } from "../src/lib/arc";
import { GatewayClient } from "@circle-fin/x402-batching/client";

// WorkNet Autonomous Agent Runner
//
// 1. Discovers open jobs: free via /api/bootstrap, or paid + ranked via the
//    x402 recommendations API (Circle Gateway Nanopayments) when configured.
// 2. Applies to skill-matched jobs with a wk_agent_... API key.
//
// Env:
//   WORKNET_API_URL          (default https://worknet.rizzgm.xyz)
//   WORKNET_AGENT_API_KEY    wk_agent_... key
//   WORKNET_AGENT_ID         agent uuid (also derived server-side from the key)
//   AGENT_SKILLS             comma-separated skill tags
//   WORKNET_BUYER_PRIVATE_KEY  EOA key funding paid API calls (Gateway balance)
//   WORKNET_PAID_DISCOVERY   "true" to use the paid recommendations API

const PLATFORM_URL = process.env.WORKNET_API_URL || "https://worknet.rizzgm.xyz";
const AGENT_API_KEY = process.env.WORKNET_AGENT_API_KEY;
const AGENT_ID = process.env.WORKNET_AGENT_ID;
const AGENT_SKILLS = (process.env.AGENT_SKILLS || "TypeScript,Solidity,Next.js")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const BUYER_PRIVATE_KEY = process.env.WORKNET_BUYER_PRIVATE_KEY;
const USE_PAID_DISCOVERY = process.env.WORKNET_PAID_DISCOVERY === "true";
const AGENT_BIO = "WorkNet Autonomous Agent powered by Circle Developer-Controlled Wallets on Arc Testnet.";

type WorkNetJob = {
  id: string;
  status: string;
  tags: string | string[];
  title: string;
  brief: string;
  budgetUsdcUnits: number;
};

function jobTagList(job: WorkNetJob): string[] {
  const raw = Array.isArray(job.tags) ? job.tags.join(",") : String(job.tags || "");
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

async function authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers = { ...extra };
  if (AGENT_API_KEY) headers["Authorization"] = `Bearer ${AGENT_API_KEY}`;
  return headers;
}

async function fetchOpenJobs(): Promise<WorkNetJob[]> {
  console.log(`Fetching jobs from ${PLATFORM_URL}...`);
  const response = await fetch(`${PLATFORM_URL}/api/bootstrap`, {
    headers: await authHeaders(),
    // bootstrap is public; the header is forwarded for consistency only.
  });
  if (!response.ok) {
    throw new Error(`Failed to bootstrap: ${response.statusText}`);
  }
  const data = (await response.json()) as {
    state?: { jobs?: WorkNetJob[] };
  };
  return (data?.state?.jobs || []).filter((job) => job.status === "open");
}

// Paid discovery: ranked open jobs for this agent's skill set, paid gasless
// through Circle Gateway Nanopayments (x402). One-time USDC deposit into the
// buyer's Gateway balance is required beforehand.
async function fetchPaidRecommendations(
  skills: string[],
): Promise<{ jobs: WorkNetJob[]; amountUsdc: number } | undefined> {
  if (!USE_PAID_DISCOVERY || !BUYER_PRIVATE_KEY) return undefined;

  const gateway = new GatewayClient({
    chain: "arcTestnet",
    privateKey: BUYER_PRIVATE_KEY as `0x${string}`,
  });
  const { data, amount } = await gateway.pay<{ recommendations: Array<{ job: WorkNetJob }> }>(
    `${PLATFORM_URL}/api/v1/recommendations`,
    { method: "POST", body: { skills, limit: 10 } },
  );
  return {
    jobs: (data?.recommendations ?? []).map((entry) => entry.job),
    amountUsdc: Number(amount ?? 0) / 1_000_000,
  };
}

async function submitJobApplication(jobId: string, pitch: string): Promise<boolean> {
  const res = await fetch(`${PLATFORM_URL}/api/jobs/${jobId}/apply`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      actorType: "agent",
      applicantAgentId: AGENT_ID,
      pitch,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`  Apply failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.ok;
}

async function main() {
  console.log("=== WORKNET AUTONOMOUS HEADLESS AGENT RUNNER ===");
  console.log(`Environment: ${AGENT_API_KEY ? "API Key Authenticated (Headless)" : "Anonymous / Local"}`);
  console.log(`Target Platform: ${PLATFORM_URL}`);

  try {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    const blockNumber = await publicClient.getBlockNumber();
    console.log(`Connected to Arc Testnet. Current Block: ${blockNumber}`);

    // Discovery: free listing, optionally refined by the paid ranked API.
    let openJobs = await fetchOpenJobs();
    console.log(`Found ${openJobs.length} open jobs.`);

    if (USE_PAID_DISCOVERY && BUYER_PRIVATE_KEY) {
      try {
        console.log("Querying paid recommendations (x402 / Gateway Nanopayments)...");
        const paid = await fetchPaidRecommendations(AGENT_SKILLS);
        if (paid) {
          console.log(`Paid ${paid.amountUsdc} USDC for ${paid.jobs.length} ranked jobs.`);
          const byId = new Map<string, WorkNetJob>();
          for (const job of paid.jobs) byId.set(job.id, job);
          for (const job of openJobs) if (!byId.has(job.id)) byId.set(job.id, job);
          openJobs = [...byId.values()];
        }
      } catch (err) {
        console.warn(
          "Paid discovery failed, continuing with the free listing:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    const matchedJobs = openJobs.filter((job) => {
      const tags = jobTagList(job);
      return tags.some((tag) => AGENT_SKILLS.some((skill) => skill.toLowerCase() === tag));
    });

    console.log(`Matched ${matchedJobs.length} jobs with Agent skills: [${AGENT_SKILLS.join(", ")}]`);

    for (const job of matchedJobs) {
      console.log(`\nEvaluating Job: "${job.title}" (${job.budgetUsdcUnits / 1_000_000} USDC)`);
      const pitch = `Automated proposal by WorkNet AI Bot. Skills: ${AGENT_SKILLS.join(", ")}. Immediate execution on Arc. ${AGENT_BIO}`;

      const success = await submitJobApplication(job.id, pitch);
      if (success) {
        console.log(`Successfully applied to Job #${job.id}`);
      } else {
        console.warn(`Failed to apply to Job #${job.id}`);
      }
    }
  } catch (err) {
    console.error("Worker error:", err instanceof Error ? err.message : err);
  }
}

main();
