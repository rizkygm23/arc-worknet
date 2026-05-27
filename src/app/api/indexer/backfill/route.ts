import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { ARC_TESTNET_CHAIN_ID, ARC_RPC_URL, ARC_USDC_ADDRESS, ERC8183_CONTRACT_ADDRESS } from "@/lib/arc";
import { getServiceClientOrResponse, requireAdminSecret } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { rateLimit } from "@/lib/server/rate-limit";
import { TABLES } from "@/lib/supabase/tables";

const erc20Transfer = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export async function GET(request: Request) {
  const secretResponse = requireAdminSecret(request);
  if (secretResponse) return secretResponse;
  const limited = await rateLimit(request, {
    key: "indexer:backfill",
    limit: 20,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const url = new URL(request.url);
  const fromBlockParam = url.searchParams.get("fromBlock");
  const toBlockParam = url.searchParams.get("toBlock");
  const fromBlock = fromBlockParam ? BigInt(fromBlockParam) : undefined;
  const toBlock = toBlockParam ? BigInt(toBlockParam) : undefined;

  if (!fromBlock || !toBlock) {
    return NextResponse.json(
      { error: "fromBlock and toBlock query parameters are required for bounded backfills." },
      { status: 400 },
    );
  }
  if (toBlock < fromBlock) {
    return NextResponse.json({ error: "toBlock must be greater than or equal to fromBlock." }, { status: 400 });
  }
  if (toBlock - fromBlock > BigInt(10_000)) {
    return NextResponse.json({ error: "Backfill range is capped at 10,000 blocks per request." }, { status: 400 });
  }

  const publicClient = createPublicClient({
    chain: {
      id: ARC_TESTNET_CHAIN_ID,
      name: "Arc Testnet",
      nativeCurrency: { decimals: 6, name: "USDC", symbol: "USDC" },
      rpcUrls: { default: { http: [ARC_RPC_URL] } },
    },
    transport: http(ARC_RPC_URL),
  });

  const usdcLogs = await publicClient.getLogs({
    address: ARC_USDC_ADDRESS,
    event: erc20Transfer,
    fromBlock,
    toBlock,
  });

  const rows = usdcLogs.map((log) => ({
    chain_id: ARC_TESTNET_CHAIN_ID,
    blockchain: "ARC-TESTNET",
    contract_address: ARC_USDC_ADDRESS,
    event_signature: "Transfer(address,address,uint256)",
    tx_hash: log.transactionHash,
    block_hash: log.blockHash,
    block_number: Number(log.blockNumber),
    log_index: log.logIndex,
    topics: [...log.topics],
    data: log.data,
    decoded: {
      from: log.args.from,
      to: log.args.to,
      value: log.args.value?.toString(),
    },
  }));

  if (rows.length) {
    const { error } = await supabase
      .from(TABLES.events)
      .upsert(rows, { onConflict: "chain_id,tx_hash,log_index" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await invalidateBootstrapCache();
  }

  return NextResponse.json({
    contract: ERC8183_CONTRACT_ADDRESS,
    usdcTransfersIndexed: rows.length,
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
  });
}
