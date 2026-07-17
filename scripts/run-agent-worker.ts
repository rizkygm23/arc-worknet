import { execSync } from "child_process";

// Configuration
const PLATFORM_URL = "http://localhost:3000";
const AGENT_SKILLS = ["TypeScript", "Solidity", "Next.js"];
const AGENT_BIO = "Autonomous AI Agent specialized in smart contract audit and full-stack integration.";

// Helper to execute Privy CLI commands safely
function runPrivyCommand(args: string): string {
  try {
    const cmd = `npx --package=@privy-io/agent-wallet-cli privy-agent-wallet ${args}`;
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    throw new Error(`Privy CLI error: ${err.stderr || err.message}`);
  }
}

// Helper to verify Privy Session and get wallet address
function getAgentWallet(): string {
  console.log("Checking Privy session...");
  const output = runPrivyCommand("list-wallets");
  
  // Parse wallet address from output (e.g. "Ethereum:  0xAbC123...")
  const ethMatch = output.match(/Ethereum:\s+(0x[a-fA-F0-9]{40})/i);
  if (!ethMatch) {
    throw new Error("No active Privy session. Run 'pnpm --package=@privy-io/agent-wallet-cli dlx privy-agent-wallet login' first.");
  }
  return ethMatch[1];
}

async function fetchOpenJobs() {
  console.log(`Fetching jobs from ${PLATFORM_URL}...`);
  const response = await fetch(`${PLATFORM_URL}/api/bootstrap`);
  if (!response.ok) {
    throw new Error(`Failed to bootstrap: ${response.statusText}`);
  }
  const data = (await response.json()) as { state?: { jobs?: Array<{ id: string; status: string; tags: string; title: string; brief: string; budgetUsdcUnits: number }> } };
  const jobs = data?.state?.jobs || [];
  return jobs.filter((job) => job.status === "open");
}

// Main autonomous loop
async function main() {
  try {
    console.log("=== WORKNET AUTONOMOUS WORKER AGENT ===");
    
    // 1. Get Agent identity
    const walletAddress = getAgentWallet();
    console.log(`Agent active Ethereum wallet: ${walletAddress}`);

    // 2. Fetch jobs
    const openJobs = await fetchOpenJobs();
    console.log(`Found ${openJobs.length} open jobs on the marketplace.`);

    // 3. Match jobs based on tags & skills
    const matchedJobs = openJobs.filter((job) => {
      const jobTags = (job.tags || "").split(",").map((t: string) => t.trim().toLowerCase());
      return jobTags.some((tag: string) => 
        AGENT_SKILLS.some(skill => skill.toLowerCase() === tag)
      );
    });

    console.log(`Matched ${matchedJobs.length} jobs with Agent skills: [${AGENT_SKILLS.join(", ")}]`);

    for (const job of matchedJobs) {
      console.log(`\n--- Job Matched: "${job.title}" ---`);
      console.log(`Budget: ${job.budgetUsdcUnits / 1_000_000} USDC`);
      console.log(`Brief: ${job.brief}`);
      
      // 4. Generate AI pitch (Mock LLM response for demonstration)
      const pitch = `Hello! I am an autonomous AI worker agent. I have matched skills for this task. I can implement the required task under budget and within 24 hours. My bio: ${AGENT_BIO}`;
      console.log(`Generated Proposal Pitch:\n> "${pitch}"`);

      // 5. Sign the intent via Privy
      console.log("Signing application intent...");
      const message = `Apply to Job ${job.id} at ${new Date().toISOString()}`;
      const signOutput = runPrivyCommand(`rpc --json '{
        "method": "personal_sign",
        "params": {
          "message": "${message}"
        }
      }'`);
      
      console.log(`Signature generated: ${signOutput}`);

      // 6. Submit Application to Platform API (Offchain marketplace)
      console.log("Submitting application to WorkNet...");
      // In production, this request would include the wallet signature to authorize the application
      const applyRes = await fetch(`${PLATFORM_URL}/api/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitch,
          walletAddress,
          signature: signOutput,
          message
        })
      });

      if (applyRes.ok) {
        console.log(`Success! Application sent for Job #${job.id}.`);
      } else {
        const errJson = await applyRes.json().catch(() => ({}));
        console.warn(`Failed to apply: ${errJson.error || applyRes.statusText}`);
      }
    }

    console.log("\nLoop completed. Agent is waiting for Client approval...");
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`\nError: ${err.message}`);
  }
}

main();
