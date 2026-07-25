import { getAddress, type Abi, type Address } from "viem";

export interface CctpNetworkConfig {
  id: string;
  name: string;
  chainId: number;
  domain: number;
  usdcAddress: Address;
  tokenMessengerAddress: Address;
  explorerUrl: string;
  rpcUrl: string;
  iconUrl: string;
}

export const CCTP_TESTNET_NETWORKS: CctpNetworkConfig[] = [
  {
    id: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    domain: 0,
    usdcAddress: getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
    tokenMessengerAddress: getAddress("0x9f3B8679c73C2Fef8b59B4f3444d4d156fb70AA5"),
    explorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    iconUrl: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png",
  },
  {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    domain: 3,
    usdcAddress: getAddress("0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"),
    tokenMessengerAddress: getAddress("0x9f3B8679c73C2Fef8b59B4f3444d4d156fb70AA5"),
    explorerUrl: "https://sepolia.arbiscan.io",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    iconUrl: "https://assets.coingecko.com/coins/images/16547/standard/arbitrum.png",
  },
  {
    id: "base-sepolia",
    name: "Base Sepolia",
    chainId: 84532,
    domain: 6,
    usdcAddress: getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
    tokenMessengerAddress: getAddress("0x9f3B8679c73C2Fef8b59B4f3444d4d156fb70AA5"),
    explorerUrl: "https://sepolia.basescan.org",
    rpcUrl: "https://sepolia.base.org",
    iconUrl: "https://assets.coingecko.com/coins/images/31164/standard/base.png",
  },
  {
    id: "avalanche-fuji",
    name: "Avalanche Fuji",
    chainId: 43113,
    domain: 1,
    usdcAddress: getAddress("0x5425890298aed601595a70AB815c96711a31Bc65"),
    tokenMessengerAddress: getAddress("0xeb08f243e5d32c326f768d85a078f77a7344911d"),
    explorerUrl: "https://testnet.snowtrace.io",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    iconUrl: "https://assets.coingecko.com/coins/images/12559/standard/Avalanche_Circle_RedWhite_Trans.png",
  },
];

export const cctpTokenMessengerAbi = [
  {
    type: "function",
    name: "depositForBurn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
    ],
    outputs: [{ name: "_nonce", type: "uint64" }],
  },
] as const satisfies Abi;

export function addressToBytes32(address: string): `0x${string}` {
  const clean = address.toLowerCase().replace(/^0x/, "");
  return `0x${clean.padStart(64, "0")}`;
}

export async function fetchCircleAttestation(messageHash: string): Promise<{ status: string; attestation?: string }> {
  try {
    const res = await fetch(`https://iris-api-sandbox.circle.com/v1/attestations/${messageHash}`);
    if (!res.ok) return { status: "pending" };
    const data = await res.json();
    return {
      status: data.status ?? "pending",
      attestation: data.attestation,
    };
  } catch {
    return { status: "pending" };
  }
}
