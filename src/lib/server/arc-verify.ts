import { createPublicClient, decodeEventLog, decodeFunctionData, http, type Abi, type Hex } from "viem";
import { ARC_RPC_URL, ARC_TESTNET_CHAIN_ID, arcTestnet, erc8183Abi } from "@/lib/arc";

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_RPC_URL),
});

function normalize(address?: string | null): string {
  return address?.toLowerCase() ?? "";
}

export type VerifiedArcTransaction = {
  receipt: Awaited<ReturnType<typeof publicClient.getTransactionReceipt>>;
  functionName: string;
  args: readonly unknown[];
};

/** Reads the escrow jobId argument at `index` from decoded tx args. */
export function arcJobIdFromArgs(args: readonly unknown[], index = 0): string | undefined {
  const value = args[index];
  return typeof value === "bigint" ? value.toString() : undefined;
}

/**
 * Collects every address recorded by escrow-contract events in a receipt.
 * ERC-4337 (Circle SCA) transactions are broadcast by a bundler, so tx.from is
 * the relayer — the real actor is whatever address the contract recorded in
 * its event fields (e.g. Submitted.provider).
 */
function eventActorAddresses(
  receipt: Awaited<ReturnType<typeof publicClient.getTransactionReceipt>>,
  contractAddress: string,
  abi: Abi,
): string[] {
  const addresses = new Set<string>();
  for (const log of receipt.logs) {
    if (normalize(log.address) !== normalize(contractAddress)) continue;
    try {
      const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics });
      for (const value of decoded.args ?? []) {
        if (typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value)) {
          addresses.add(normalize(value));
        }
      }
    } catch {
      // Ignore unrelated logs from the same transaction.
    }
  }
  return [...addresses];
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
}): Promise<VerifiedArcTransaction> {
  const [transaction, receipt] = await Promise.all([
    publicClient.getTransaction({ hash: txHash as Hex }),
    publicClient.getTransactionReceipt({ hash: txHash as Hex }),
  ]);

  if (transaction.chainId !== ARC_TESTNET_CHAIN_ID) {
    throw new Error("Transaction is not on the configured Arc chain.");
  }
  // tx.from alone is wrong for ERC-4337 sends (bundler/relayer signs), so a tx
  // also verifies when the expected wallet appears in the escrow events.
  const expected = normalize(expectedFrom);
  const senderOk =
    normalize(transaction.from) === expected ||
    eventActorAddresses(receipt, expectedTo, abi).includes(expected);
  if (!senderOk) {
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

  return { receipt, functionName: decoded.functionName, args: decoded.args ?? [] };
}

/** Reads the funded USDC amount from the Funded event emitted by the fund tx. */
export async function extractFundedAmount(
  txHash: string,
  contractAddress: string,
): Promise<bigint | undefined> {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hex });
  for (const log of receipt.logs) {
    if (normalize(log.address) !== normalize(contractAddress)) continue;
    try {
      const decoded = decodeEventLog({
        abi: erc8183Abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "Funded" && "amount" in decoded.args) {
        const amount = decoded.args.amount;
        return typeof amount === "bigint" ? amount : undefined;
      }
    } catch {
      // Ignore unrelated logs from the same transaction.
    }
  }

  return undefined;
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
