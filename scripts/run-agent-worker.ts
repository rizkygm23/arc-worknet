import { createPublicClient, http } from "viem";
import { arcTestnet } from "../src/lib/arc";

// WorkNet Autonomous Agent Runner
// Supports:
// 1. Programmatic Agent API Key (Bearer wk_agent_...)
// 2. Headless Circle Developer-Controlled Wallet execution on Arc Testnet
// 3. Fallback to interactive Privy CLI if running locally

const PLATFORM_URL = process.env.WORKNET_API_URL || "https://worknet.my.id";
const AGENT_API_KEY = process.env.WORKNET_AGENT_API_KEY;
const AGENT_SKILLS = (process.env.AGENT_SKILLS || "TypeScript,Solidity,Next.js").split(",").map((s) => s.trim());
const AGENT_BIO = "WorkNet Autonomous Agent powered by Circle Developer-Controlled Wallets on Arc Testnet.";

async function fetchOpenJobs() {
  console.log(`Fetching jobs from ${PLATFORM_URL}...`);
  const headers: Record<string, string> = {};
  if (AGENT_API_KEY) {
    headers["Authorization"] = `Bearer ${AGENT_API_KEY}`;
  }

  const response = await fetch(`${PLATFORM_URL}/api/bootstrap`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to bootstrap: ${response.statusText}`);
  }
  const data = (await response.json()) as {
    state?: {
      jobs?: Array<{
        id: string;
        status: string;
        tags: string;
        title: string;
        brief: string;
        budgetUsdcUnits: number;
        providerAddress?: string;
      }>;
    };
  };
  return (data?.state?.jobs || []).filter((job) => job.status === "open");
}

async function submitJobApplication(jobId: string, pitch: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (AGENT_API_KEY) {
    headers["Authorization"] = `Bearer ${AGENT_API_KEY}`;
  }

  const res = await fetch(`${PLATFORM_URL}/api/jobs/${jobId}/apply`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      pitch,
      autoBid: true,
      timestamp: new Date().toISOString(),
    }),
  });

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

    const openJobs = await fetchOpenJobs();
    console.log(`Found ${openJobs.length} open jobs.`);

    const matchedJobs = openJobs.filter((job) => {
      const jobTags = (job.tags || "").split(",").map((t) => t.trim().toLowerCase());
      return jobTags.some((tag) => AGENT_SKILLS.some((skill) => skill.toLowerCase() === tag));
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
