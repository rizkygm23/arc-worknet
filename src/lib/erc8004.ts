import type { Abi } from "viem";

/**
 * ERC-8004 Reputation Registry — minimal ABI for writing feedback.
 *
 * ERC-8004 is a DRAFT and the `giveFeedback` signature has varied across
 * revisions. This matches the current EIP draft form. The registry deployed on
 * Arc may differ; all writes through this ABI are best-effort and guarded by
 * try/catch in the caller (see store.tsx reviewSubmission).
 *
 * Spec note: feedbackHash is the KECCAK-256 of the content at feedbackURI, or
 * bytes32(0) when omitted. We pass the job's reasonHash as a verifiable anchor.
 */
export const reputationRegistryAbi = [
  {
    type: "function",
    name: "giveFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "value", type: "int128" },
      { name: "valueDecimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const satisfies Abi;
