import { createPublicClient, decodeEventLog, decodeFunctionData, http, type Abi, type Hex } from "viem";
import { ARC_RPC_URL, ARC_TESTNET_CHAIN_ID, arcTestnet, erc8183Abi } from "@/lib/arc";

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_RPC_URL),
});

function normalize(address?: string | null) {
  return address?.toLowerCase();
}

export async function verifyArcTransaction({
  abi,
  expectedFrom,
  expectedFunctionName,
  expectedTo,
  txHash,
}: {
  abi: Abi;
  expectedFrom: string;
  expectedFunctionName: string;
  expectedTo: string;
  txHash: string;
}) {
  const [transaction, receipt] = await Promise.all([
    publicClient.getTransaction({ hash: txHash as Hex }),
    publicClient.getTransactionReceipt({ hash: txHash as Hex }),
  ]);

  if (transaction.chainId !== ARC_TESTNET_CHAIN_ID) {
    throw new Error("Transaction is not on the configured Arc chain.");
  }
  if (normalize(transaction.from) !== normalize(expectedFrom)) {
    throw new Error("Transaction sender does not match connected wallet.");
  }
  if (normalize(transaction.to) !== normalize(expectedTo)) {
    throw new Error("Transaction target does not match expected contract.");
  }
  if (receipt.status !== "success") {
    throw new Error("Arc transaction was not successful.");
  }

  const decoded = decodeFunctionData({ abi, data: transaction.input });
  if (decoded.functionName !== expectedFunctionName) {
    throw new Error("Transaction method does not match expected action.");
  }

  return receipt;
}

export async function extractCreatedArcJobId(txHash: string, contractAddress: string) {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hex });
  for (const log of receipt.logs) {
    if (normalize(log.address) !== normalize(contractAddress)) continue;
    try {
      const decoded = decodeEventLog({
        abi: erc8183Abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "JobCreated" && "jobId" in decoded.args) {
        return decoded.args.jobId.toString();
      }
    } catch {
      // Ignore unrelated logs from the same transaction.
    }
  }

  return undefined;
}
