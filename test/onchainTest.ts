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

// 2. Setup Viem Clients
const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_RPC_URL),
});

const account1 = privateKeyToAccount(FIRST_WALLET_PRIVATE_KEY as `0x${string}`);
const account2 = privateKeyToAccount(SECOND_WALLET_PRIVATE_KEY as `0x${string}`);

const client1 = createWalletClient({
  account: account1,
  chain: arcTestnet,
  transport: http(ARC_RPC_URL),
});

const client2 = createWalletClient({
  account: account2,
  chain: arcTestnet,
  transport: http(ARC_RPC_URL),
});

// Helper for waiting/sleeping
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    console.log("Supabase credentials not found in env, skipping DB sync.");
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
      console.log(`Successfully synced Job #${jobIdOnchain} to Supabase Database.`);
      
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
        
      console.log("Updated database profile statistics for Client and Worker.");
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to sync job to database:", errorMsg);
  }
}

async function recoverStuckJobs() {
  console.log("\nChecking for any stuck escrow jobs on-chain...");
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

    console.log(`Scanning Job ID ${endScan} to ${startScan} on-chain...`);
    for (let id = startScan; id >= endScan; id--) {
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
          console.log(`\nFound stuck Job #${id} with ${formatUnits(fundedAmount, 6)} USDC locked!`);
          
          // Determine which wallet is Client/Provider
          const isWallet1Client = client.toLowerCase() === account1.address.toLowerCase();
          const clientWallet = isWallet1Client ? client1 : client2;
          const providerWallet = isWallet1Client ? client2 : client1;

          if (status === 3 || status === 5) {
            console.log(`[Recovery] Submitting deliverable for Job #${id}...`);
            const mockDeliverable = "0x1234567890123456789012345678901234567890123456789012345678901234" as `0x${string}`;
            const submitHash = await providerWallet.writeContract({
              address: ERC8183_CONTRACT_ADDRESS,
              abi: erc8183Abi,
              functionName: "submit",
              args: [id, mockDeliverable, "0x"],
            });
            await publicClient.waitForTransactionReceipt({ hash: submitHash });
            console.log("Deliverable submitted!");
            await sleep(600);
          }

          console.log(`[Recovery] Releasing funds (completing) Job #${id}...`);
          const mockReason = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`;
          const completeHash = await clientWallet.writeContract({
            address: ERC8183_CONTRACT_ADDRESS,
            abi: erc8183Abi,
            functionName: "complete",
            args: [id, mockReason, "0x"],
          });
          await publicClient.waitForTransactionReceipt({ hash: completeHash });
          console.log(`Job #${id} successfully recovered and funds released to provider!`);

          await sleep(600);
        }
      }
    }
    console.log("Stuck job scan complete.\n");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error during stuck jobs recovery scan:", errorMsg);
  }
}

async function main() {
  console.log("====================================================");
  console.log("             Arc WorkNet Onchain Simulation         ");
  console.log("====================================================");
  console.log(`Wallet 1: ${account1.address}`);
  console.log(`Wallet 2: ${account2.address}`);
  console.log(`Escrow Contract: ${ERC8183_CONTRACT_ADDRESS}`);
  console.log(`USDC Contract: ${ARC_USDC_ADDRESS}`);
  console.log("====================================================\n");

  await recoverStuckJobs();

  // Configurable Max Iterations
  const MAX_ITERATIONS = Infinity; // Set to Infinity for endless loop
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n--- Iteration ${iteration} / ${MAX_ITERATIONS === Infinity ? "Infinity" : MAX_ITERATIONS} ---`);

    // Read initial balances for both wallets to determine who should be Client
    console.log("\nReading USDC balances...");
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

    console.log(`Wallet 1 Balance : ${formatUnits(bal1, 6)} USDC`);
    console.log(`Wallet 2 Balance : ${formatUnits(bal2, 6)} USDC`);

    const wallet1IsClient = bal1 >= bal2;
    const clientWallet = wallet1IsClient ? client1 : client2;
    const clientAccount = wallet1IsClient ? account1 : account2;
    const clientBal = wallet1IsClient ? bal1 : bal2;

    const providerWallet = wallet1IsClient ? client2 : client1;
    const providerAccount = wallet1IsClient ? account2 : account1;
    const providerBal = wallet1IsClient ? bal2 : bal1;

    console.log(`Client (Evaluator) : ${clientAccount.address}`);
    console.log(`Provider           : ${providerAccount.address}`);

    // Ensure Provider has enough gas to execute submit (e.g. at least 1 USDC)
    const minGasBuffer = BigInt(1000000); // 1 USDC
    let clientBalAfterSeed = clientBal;
    let providerBalAfterSeed = providerBal;

    if (providerBal < minGasBuffer) {
      console.log(`\n[Gas Seeding] Provider has low balance for gas (${formatUnits(providerBal, 6)} USDC).`);
      const seedAmount = minGasBuffer; // Flat 1 USDC

      // Check if client can afford to seed and still have gas buffer
      const requiredClientBalance = seedAmount + BigInt(2000000) + BigInt(1000000); // seed + 2 USDC gas + 1 USDC budget
      if (clientBal >= requiredClientBalance) {
        console.log(`Seeding Provider with ${formatUnits(seedAmount, 6)} USDC for gas...`);
        const seedHash = await clientWallet.writeContract({
          address: ARC_USDC_ADDRESS,
          abi: usdcAbiWithTransfer,
          functionName: "transfer",
          args: [providerAccount.address, seedAmount],
        });
        console.log(`Seed TX Hash: ${seedHash}`);
        await publicClient.waitForTransactionReceipt({ hash: seedHash });
        console.log("Seeding complete!");

        clientBalAfterSeed = clientBal - seedAmount;
        providerBalAfterSeed = providerBal + seedAmount;
        console.log(`New Balances: Client = ${formatUnits(clientBalAfterSeed, 6)} USDC, Provider = ${formatUnits(providerBalAfterSeed, 6)} USDC`);
      } else {
        console.log("⚠️  Client does not have enough balance to seed provider gas.");
      }
    }

    // Calculate budget: usdc balance - 2 USDC (2_000_000 micro-USDC)
    const twoUsdc = BigInt(2000000);
    if (clientBalAfterSeed <= twoUsdc + BigInt(1000000)) {
      console.log(`⚠️  Client balance after potential seeding is too low to run this iteration (need > 3 USDC).`);
      console.log("Please transfer USDC to the client address and run again.");
      break;
    }

    const budget = clientBalAfterSeed - twoUsdc;
    console.log(`Calculated Escrow Budget: ${formatUnits(budget, 6)} USDC (2 USDC kept for gas)`);

    try {
      // Step 1: Create Job
      console.log("\n[Step 1] Creating Job on Escrow contract...");
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
      console.log(`TX Hash: ${createHash}`);
      console.log("Waiting for confirmation...");
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      console.log(`Job Created! Block: ${createReceipt.blockNumber}`);

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
      console.log(`Job ID: ${jobId}`);

      await sleep(600);

      // Step 2: Set Budget
      console.log("\n[Step 2] Setting Budget...");
      const budgetHash = await clientWallet.writeContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "setBudget",
        args: [jobId, budget, "0x"],
      });
      console.log(`TX Hash: ${budgetHash}`);
      await publicClient.waitForTransactionReceipt({ hash: budgetHash });
      console.log("Budget Set!");

      await sleep(600);

      // Step 3: Approve Escrow contract to spend client USDC
      console.log("\n[Step 3] Approving USDC for Escrow Contract...");
      const approveHash = await clientWallet.writeContract({
        address: ARC_USDC_ADDRESS,
        abi: erc20UsdcAbi,
        functionName: "approve",
        args: [ERC8183_CONTRACT_ADDRESS, budget],
      });
      console.log(`TX Hash: ${approveHash}`);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log("USDC Approved!");

      await sleep(600);

      // Step 4: Fund the Job
      console.log("\n[Step 4] Funding Escrow...");
      const fundHash = await clientWallet.writeContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "fund",
        args: [jobId, "0x"],
      });
      console.log(`TX Hash: ${fundHash}`);
      await publicClient.waitForTransactionReceipt({ hash: fundHash });
      console.log("Escrow Funded!");

      await sleep(600);

      // Step 5: Submit Job
      console.log("\n[Step 5] Submitting Deliverable...");
      const deliverableHash = "0x1234567890123456789012345678901234567890123456789012345678901234" as `0x${string}`;
      const submitHash = await providerWallet.writeContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "submit",
        args: [jobId, deliverableHash, "0x"],
      });
      console.log(`TX Hash: ${submitHash}`);
      await publicClient.waitForTransactionReceipt({ hash: submitHash });
      console.log("Deliverable Submitted!");

      await sleep(600);

      // Step 6: Complete Job (Release Funds)
      console.log("\n[Step 6] Completing Job (Releasing Funds)...");
      const completionReasonHash = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd" as `0x${string}`;
      const completeHash = await clientWallet.writeContract({
        address: ERC8183_CONTRACT_ADDRESS,
        abi: erc8183Abi,
        functionName: "complete",
        args: [jobId, completionReasonHash, "0x"],
      });
      console.log(`TX Hash: ${completeHash}`);
      await publicClient.waitForTransactionReceipt({ hash: completeHash });
      console.log("Job Completed!");

      console.log("\nWaiting for block finality...");
      await sleep(600);

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

      console.log(`\nFinal USDC Balances:`);
      console.log(`Client Balance   : ${formatUnits(clientBalFinal, 6)} USDC (Diff: ${formatUnits(clientBalFinal - clientBal, 6)} USDC)`);
      console.log(`Provider Balance : ${formatUnits(providerBalFinal, 6)} USDC (Diff: ${formatUnits(providerBalFinal - providerBal, 6)} USDC)`);

      // Sync job and update user statistics in Supabase
      console.log("\nSyncing job result to database...");
      await syncJobToDatabase({
        clientAddress: clientAccount.address,
        providerAddress: providerAccount.address,
        budgetUnits: budget,
        jobIdOnchain: jobId,
        createTxHash: createHash,
        completeTxHash: completeHash,
      });

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error in iteration ${iteration}:`, errorMsg);
      break;
    }
  }

  console.log("\n====================================================");
  console.log("            Simulation Complete                     ");
  console.log("====================================================");
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
