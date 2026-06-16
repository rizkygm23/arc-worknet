import {
  createPublicClient,
  decodeEventLog,
  http,
  type Address,
  type Hash,
} from "viem";
import {
  ARC_EXPLORER_URL,
  ARC_RPC_URL,
  ARC_TESTNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  ERC8183_CONTRACT_ADDRESS,
  arcTestnet,
  erc20UsdcAbi,
  erc8183Abi,
} from "./arc";

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_RPC_URL),
});

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type WalletLike = {
  chainId?: string;
  getEthereumProvider: () => Promise<Eip1193Provider>;
};

// MetaMask requires nativeCurrency.decimals === 18 when adding a chain via
// wallet_addEthereumChain. Arc Testnet pays gas in USDC (6 decimals), so we
// advertise an 18-decimal placeholder symbol to MM purely for its display
// validator. On-chain fee accounting is unaffected — the RPC reports real USDC
// balances after the chain is added.
const ARC_ADD_CHAIN_PARAMS = {
  chainId: `0x${ARC_TESTNET_CHAIN_ID.toString(16)}`,
  chainName: "Arc Testnet",
  nativeCurrency: { name: "Arc", symbol: "ARC", decimals: 18 },
  rpcUrls: [ARC_RPC_URL],
  blockExplorerUrls: [ARC_EXPLORER_URL],
} as const;

function hasErrorCode(error: unknown, code: number): boolean {
  if (typeof error !== "object" || error === null) return false;
  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "number" && maybeCode === code;
}

export async function ensureArcNetwork(wallet: WalletLike): Promise<void> {
  const current = Number(wallet.chainId?.split(":").pop() ?? "0");
  if (current === ARC_TESTNET_CHAIN_ID) return;

  const provider = await wallet.getEthereumProvider();
  const hexId = `0x${ARC_TESTNET_CHAIN_ID.toString(16)}`;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexId }],
    });
    return;
  } catch (error) {
    // 4902 = chain not added. Some wallets also surface -32603 with that meaning.
    const needsAdd = hasErrorCode(error, 4902) || hasErrorCode(error, -32603);
    if (!needsAdd) throw error;
  }

  await provider.request({
    method: "wallet_addEthereumChain",
    params: [ARC_ADD_CHAIN_PARAMS],
  });

  // Some wallets need an explicit switch after add.
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexId }],
    });
  } catch {
    // MetaMask auto-switches after add; ignore "already on chain" errors.
  }
}

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

export async function readEscrowOwner(): Promise<Address> {
  return publicClient.readContract({
    address: ERC8183_CONTRACT_ADDRESS,
    abi: erc8183Abi,
    functionName: "owner",
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
