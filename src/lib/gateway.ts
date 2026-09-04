import { getAddress, type Address } from "viem";
import { ARC_TESTNET_CHAIN_ID, ARC_USDC_ADDRESS } from "@/lib/arc";

export interface GatewayNetworkConfig {
  id: string;
  name: string;
  chainId: number;
  usdcAddress: Address;
  gatewayAddress: Address;
  explorerUrl: string;
  rpcUrl: string;
}

// Circle Gateway contract addresses on testnets
export const GATEWAY_TESTNET_NETWORKS: GatewayNetworkConfig[] = [
  {
    id: "arc-testnet",
    name: "Arc Testnet",
    chainId: ARC_TESTNET_CHAIN_ID,
    usdcAddress: ARC_USDC_ADDRESS,
    gatewayAddress: getAddress("0x0077777d7EBA4688B4467FD722791FeF1bA9c3B5"), // Circle Gateway Testnet
    explorerUrl: "https://testnet.arcscan.app",
    rpcUrl: "https://rpc.testnet.arc.network",
  },
  {
    id: "base-sepolia",
    name: "Base Sepolia",
    chainId: 84532,
    usdcAddress: getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
    gatewayAddress: getAddress("0x0077777d7EBA4688B4467FD722791FeF1bA9c3B5"),
    explorerUrl: "https://sepolia.basescan.org",
    rpcUrl: "https://sepolia.base.org",
  },
  {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    usdcAddress: getAddress("0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"),
    gatewayAddress: getAddress("0x0077777d7EBA4688B4467FD722791FeF1bA9c3B5"),
    explorerUrl: "https://sepolia.arbiscan.io",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  },
  {
    id: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    usdcAddress: getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
    gatewayAddress: getAddress("0x0077777d7EBA4688B4467FD722791FeF1bA9c3B5"),
    explorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  },
];

export const gatewayDepositAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
    ],
    outputs: [{ name: "depositId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "spend",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "spendProof", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

export function getGatewayNetwork(chainId: number): GatewayNetworkConfig | undefined {
  return GATEWAY_TESTNET_NETWORKS.find((n) => n.chainId === chainId);
}
