import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ARC_TESTNET_CHAIN_ID, ARC_RPC_URL, ERC8183_CONTRACT_ADDRESS } from "@/lib/arc";
import { TABLES } from "@/lib/supabase/tables";
import { invalidateBootstrapCache } from "@/lib/server/cache";

const events = {
  jobCreated: parseAbiItem(
    "event JobCreated(uint256 indexed jobId, address indexed client, address indexed provider)",
  ),
  budgetSet: parseAbiItem(
    "event BudgetSet(uint256 indexed jobId, uint256 amount)",
  ),
  funded: parseAbiItem(
    "event Funded(uint256 indexed jobId, address indexed client, uint256 amount)",
  ),
  submitted: parseAbiItem(
    "event Submitted(uint256 indexed jobId, address indexed provider, bytes32 deliverableHash)",
  ),
  completed: parseAbiItem(
    "event Completed(uint256 indexed jobId, address indexed evaluator, address indexed provider, uint256 providerPayout, uint256 platformFee, bytes32 reasonHash)",
  ),
  revisionRequested: parseAbiItem(
    "event RevisionRequested(uint256 indexed jobId, bytes32 reasonHash)",
  ),
  rejectedWithPenalty: parseAbiItem(
    "event RejectedWithPenalty(uint256 indexed jobId, address indexed client, address indexed provider, uint256 workerPenalty, uint256 clientRefund, bytes32 reasonHash)",
  ),
};

export async function runArcEventSync(supabase: SupabaseClient) {
  const publicClient = createPublicClient({
    chain: {
      id: ARC_TESTNET_CHAIN_ID,
      name: "Arc Testnet",
      nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
      rpcUrls: { default: { http: [ARC_RPC_URL] } },
    },
    transport: http(ARC_RPC_URL),
  });

  const latestBlock = await publicClient.getBlockNumber();

  // Retrieve last synced block from indexerState table
  const { data: state } = await supabase
    .from(TABLES.indexerState)
    .select("last_block")
    .eq("chain_id", ARC_TESTNET_CHAIN_ID)
    .single();

  const startBlock = state?.last_block
    ? BigInt(state.last_block) + BigInt(1)
    : latestBlock > BigInt(2000)
    ? latestBlock - BigInt(2000)
    : BigInt(0);

  if (startBlock > latestBlock) {
    return { synced: 0, fromBlock: startBlock.toString(), toBlock: latestBlock.toString() };
  }

  // Batch query event logs
  const [created, funded, submitted, completed, revisions, rejected] = await Promise.all([
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: events.jobCreated,
      fromBlock: startBlock,
      toBlock: latestBlock,
    }),
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: events.funded,
      fromBlock: startBlock,
      toBlock: latestBlock,
    }),
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: events.submitted,
      fromBlock: startBlock,
      toBlock: latestBlock,
    }),
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: events.completed,
      fromBlock: startBlock,
      toBlock: latestBlock,
    }),
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: events.revisionRequested,
      fromBlock: startBlock,
      toBlock: latestBlock,
    }),
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: events.rejectedWithPenalty,
      fromBlock: startBlock,
      toBlock: latestBlock,
    }),
  ]);

  const allLogs: Array<Log & { eventName: string }> = [
    ...created.map((l) => ({ ...l, eventName: "JobCreated" })),
    ...funded.map((l) => ({ ...l, eventName: "Funded" })),
    ...submitted.map((l) => ({ ...l, eventName: "Submitted" })),
    ...completed.map((l) => ({ ...l, eventName: "Completed" })),
    ...revisions.map((l) => ({ ...l, eventName: "RevisionRequested" })),
    ...rejected.map((l) => ({ ...l, eventName: "RejectedWithPenalty" })),
  ];

  if (allLogs.length > 0) {
    const records = allLogs.map((log) => ({
      contract_address: ERC8183_CONTRACT_ADDRESS,
      event_signature: log.eventName,
      tx_hash: log.transactionHash,
      block_number: Number(log.blockNumber),
      log_index: Number(log.logIndex),
      chain_id: ARC_TESTNET_CHAIN_ID,
      blockchain: "arc-testnet",
      topics: log.topics as string[],
      data: log.data,
    }));

    await supabase
      .from(TABLES.events)
      .upsert(records, { onConflict: "chain_id,tx_hash,log_index" });

    void invalidateBootstrapCache();
  }

  // Update cursor
  await supabase.from(TABLES.indexerState).upsert(
    {
      chain_id: ARC_TESTNET_CHAIN_ID,
      last_block: Number(latestBlock),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "chain_id" },
  );

  return {
    synced: allLogs.length,
    fromBlock: startBlock.toString(),
    toBlock: latestBlock.toString(),
    counts: {
      created: created.length,
      funded: funded.length,
      submitted: submitted.length,
      completed: completed.length,
      revisions: revisions.length,
      rejected: rejected.length,
    },
  };
}
