import type { Abi, Address } from "viem";
import { defineChain } from "viem";

export const ARC_TESTNET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002);
export const ARC_RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
export const ARC_WS_URL = process.env.ARC_WS_URL ?? "wss://rpc.testnet.arc.network";
export const ARC_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

export const ARC_USDC_ADDRESS = (process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ??
  "0x3600000000000000000000000000000000000000") as Address;

export const ERC8183_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ERC8183_CONTRACT_ADDRESS ??
  process.env.ERC8183_CONTRACT_ADDRESS ??
  "0x0747EEf0706327138c69792bF28Cd525089e4583") as Address;

export const ERC8004_IDENTITY_REGISTRY = (process.env.ERC8004_IDENTITY_REGISTRY ??
  "0x8004A818BFB912233c491871b3d84c89A494BD9e") as Address;

export const ERC8004_REPUTATION_REGISTRY = (process.env.ERC8004_REPUTATION_REGISTRY ??
  "0x8004B663056A597Dffe9eCcC1965A193B7388713") as Address;

export const ERC8004_VALIDATION_REGISTRY = (process.env.ERC8004_VALIDATION_REGISTRY ??
  "0x8004Cb1BF31DAf7788923b405b754f57acEB4272") as Address;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 6,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
      webSocket: [ARC_WS_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: ARC_EXPLORER_URL,
    },
  },
  testnet: true,
});

export const erc8183Abi = [
  {
    type: "function",
    name: "createJob",
    stateMutability: "nonpayable",
    inputs: [
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "hook", type: "address" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    type: "function",
    name: "setBudget",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "fund",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "deliverableHash", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "complete",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reasonHash", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "requestRevision",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reasonHash", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "raiseDispute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reasonHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "resolveDispute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "providerAmount", type: "uint256" },
      { name: "reasonHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "rejectWithPenalty",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reasonHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "jobs",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      { name: "client", type: "address" },
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "hook", type: "address" },
      { name: "budget", type: "uint256" },
      { name: "fundedAmount", type: "uint256" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "deliverableHash", type: "bytes32" },
      { name: "completionReasonHash", type: "bytes32" },
      { name: "status", type: "uint8" },
    ],
  },
  {
    type: "event",
    name: "JobCreated",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "provider", type: "address", indexed: true },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Disputed",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "actor", type: "address", indexed: true },
      { name: "reasonHash", type: "bytes32", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DisputeResolved",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "resolver", type: "address", indexed: true },
      { name: "providerPayout", type: "uint256", indexed: false },
      { name: "clientRefund", type: "uint256", indexed: false },
      { name: "reasonHash", type: "bytes32", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RejectedWithPenalty",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "provider", type: "address", indexed: true },
      { name: "workerPenalty", type: "uint256", indexed: false },
      { name: "clientRefund", type: "uint256", indexed: false },
      { name: "reasonHash", type: "bytes32", indexed: false },
    ],
    anonymous: false,
  },
] as const satisfies Abi;

export const erc20UsdcAbi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const satisfies Abi;

export function explorerTxUrl(txHash?: string) {
  return txHash ? `${ARC_EXPLORER_URL}/tx/${txHash}` : undefined;
}

export function explorerAddressUrl(address?: string) {
  return address ? `${ARC_EXPLORER_URL}/address/${address}` : undefined;
}
