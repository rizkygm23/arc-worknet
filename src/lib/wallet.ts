import {
  createPublicClient,
  decodeEventLog,
  http,
  type Address,
  type Hash,
} from "viem";
import { ARC_RPC_URL, ARC_USDC_ADDRESS, arcTestnet, erc20UsdcAbi, erc8183Abi } from "./arc";

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_RPC_URL),
});

export async function waitForArcReceipt(txHash: Hash) {
  return publicClient.waitForTransactionReceipt({ hash: txHash });
}

export async function readArcUsdcBalance(address: Address) {
  return publicClient.readContract({
    address: ARC_USDC_ADDRESS,
    abi: erc20UsdcAbi,
    functionName: "balanceOf",
    args: [address],
  });
}

export function getJobCreatedArcId(receipt: Awaited<ReturnType<typeof waitForArcReceipt>>) {
  for (const log of receipt.logs) {
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

export function formatWalletAddress(address?: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Not connected";
}
