import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { ARC_TESTNET_CHAIN_ID, ARC_RPC_URL, ERC8183_CONTRACT_ADDRESS } from "@/lib/arc";
import { getServiceClientOrResponse, requireAdminSecret } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { rateLimit } from "@/lib/server/rate-limit";
import { TABLES } from "@/lib/supabase/tables";

const jobCreatedEvent = parseAbiItem(
  "event JobCreated(uint256 indexed jobId, address indexed client, address indexed provider)",
);
const fundedEvent = parseAbiItem(
  "event Funded(uint256 indexed jobId, address indexed client, uint256 amount)",
);
const submittedEvent = parseAbiItem(
  "event Submitted(uint256 indexed jobId, address indexed provider, bytes32 deliverableHash)",
);
const completedEvent = parseAbiItem(
  "event Completed(uint256 indexed jobId, address indexed evaluator, address indexed provider, uint256 providerPayout, uint256 platformFee, bytes32 reasonHash)",
);

export async function POST(request: Request) {
  const secretResponse = requireAdminSecret(request);
  if (secretResponse) return secretResponse;

  const limited = await rateLimit(request, {
    key: "indexer:sync",
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

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
  const fromBlock = latestBlock > BigInt(1000) ? latestBlock - BigInt(1000) : BigInt(0);

  const [createdLogs, fundedLogs, submittedLogs, completedLogs] = await Promise.all([
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: jobCreatedEvent,
      fromBlock,
      toBlock: latestBlock,
    }),
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: fundedEvent,
      fromBlock,
      toBlock: latestBlock,
    }),
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: submittedEvent,
      fromBlock,
      toBlock: latestBlock,
    }),
    publicClient.getLogs({
      address: ERC8183_CONTRACT_ADDRESS,
      event: completedEvent,
      fromBlock,
      toBlock: latestBlock,
    }),
  ]);

  const syncedEventsCount = createdLogs.length + fundedLogs.length + submittedLogs.length + completedLogs.length;

  if (syncedEventsCount > 0) {
    void invalidateBootstrapCache();
  }

  return NextResponse.json({
    contractAddress: ERC8183_CONTRACT_ADDRESS,
    fromBlock: fromBlock.toString(),
    toBlock: latestBlock.toString(),
    jobCreatedCount: createdLogs.length,
    fundedCount: fundedLogs.length,
    submittedCount: submittedLogs.length,
    completedCount: completedLogs.length,
  });
}
