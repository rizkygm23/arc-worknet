import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient, encodeFunctionData, http, parseAbiItem } from "viem";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { requireWalletSession } from "@/lib/server/wallet-session";
import {
  createScaContractExecution,
  getCircleTransaction,
  getFreshEntitySecretCiphertext,
  signCircleEvmTransaction,
} from "@/lib/server/circle-wallet";
import { TABLES } from "@/lib/supabase/tables";
import { ARC_TESTNET_CHAIN_ID, ARC_USDC_ADDRESS, ERC8183_CONTRACT_ADDRESS, arcTestnet } from "@/lib/arc";

// SEC-05: Only allow agent transactions to known, trusted contracts.
const ALLOWED_CONTRACT_ADDRESSES = new Set(
  [ARC_USDC_ADDRESS, ERC8183_CONTRACT_ADDRESS]
    .filter(Boolean)
    .map((a) => a.toLowerCase()),
);

// SEC-06: Strict function whitelist per contract to prevent arbitrary function execution.
const ALLOWED_FUNCTIONS_BY_CONTRACT: Record<string, Set<string>> = {
  [ARC_USDC_ADDRESS.toLowerCase()]: new Set([
    "approve(address,uint256)",
    "transfer(address,uint256)",
  ]),
  [ERC8183_CONTRACT_ADDRESS.toLowerCase()]: new Set([
    "submit(uint256,bytes32,bytes)",
    "complete(uint256,bytes32,bytes)",
    "requestRevision(uint256,bytes32,bytes)",
    "rejectWithPenalty(uint256,bytes32)",
    "setBudget(uint256,uint256)",
  ]),
};

// Strict pattern: functionName(type1,type2,...) — no spaces, no nested parens.
const ABI_SIGNATURE_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*\([a-zA-Z0-9,[\] ]*\)$/;

const executeTransactionSchema = z.object({
  agentId: z.string().uuid(),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  abiFunctionSignature: z.string().min(3).regex(ABI_SIGNATURE_REGEX, "Invalid ABI function signature format."),
  abiParameters: z.array(z.any()).default([]),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, executeTransactionSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const { agentId, contractAddress, abiFunctionSignature, abiParameters } = parsed.data;

  // SEC-05: Reject calls to contracts outside the trusted whitelist.
  const normalizedContract = contractAddress.toLowerCase();
  if (!ALLOWED_CONTRACT_ADDRESSES.has(normalizedContract)) {
    return NextResponse.json(
      { error: "Contract address is not in the allowed whitelist." },
      { status: 403 },
    );
  }

  // SEC-06: Reject function signatures outside contract's strict whitelist.
  const allowedFunctions = ALLOWED_FUNCTIONS_BY_CONTRACT[normalizedContract];
  const normalizedSignature = abiFunctionSignature.replace(/\s+/g, "");
  if (!allowedFunctions || !allowedFunctions.has(normalizedSignature)) {
    return NextResponse.json(
      { error: `Function signature '${abiFunctionSignature}' is not authorized for execution on this contract.` },
      { status: 403 },
    );
  }

  const { data: agent, error: agentError } = await supabase
    .from(TABLES.agents)
    .select("circle_wallet_id, agent_wallet_address, owner_profile_id, wallet_type")
    .eq("id", agentId)
    .single();

  if (agentError || !agent) {
    return NextResponse.json({ error: agentError?.message || "Agent not found." }, { status: 404 });
  }

  if (agent.owner_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Only the agent owner can execute transactions." }, { status: 403 });
  }

  if (!agent.circle_wallet_id) {
    return NextResponse.json({ error: "Agent does not have a managed Circle wallet configured." }, { status: 400 });
  }

  if (!agent.agent_wallet_address) {
    return NextResponse.json({ error: "Agent does not have a wallet address configured." }, { status: 400 });
  }

  let entitySecretCiphertext = "";
  try {
    entitySecretCiphertext = await getFreshEntitySecretCiphertext();
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Encryption failed." }, { status: 500 });
  }

  const callData = encodeFunctionData({
    abi: [parseAbiItem(`function ${abiFunctionSignature}`)],
    args: abiParameters,
    functionName: abiFunctionSignature.slice(0, abiFunctionSignature.indexOf("(")),
  });

  // SCA wallets (Gas Station-sponsored) go through Circle's transaction
  // pipeline; EOA wallets keep the sign-only + raw-broadcast path.
  if (agent.wallet_type === "SCA") {
    try {
      const created = await createScaContractExecution({
        walletId: agent.circle_wallet_id,
        entitySecretCiphertext,
        contractAddress: normalizedContract,
        callData,
      });

      // The escrow lifecycle routes need the onchain tx hash; poll briefly —
      // Arc finality is sub-second, but the first SCA tx also deploys the
      // account and can take longer.
      let txHash = created.txHash;
      let state = created.state;
      const deadline = Date.now() + 30_000;
      while (!txHash && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const status = await getCircleTransaction(created.transactionId);
        state = status.state;
        txHash = status.txHash;
        if (["CONFIRMED", "COMPLETE", "FINALIZED"].includes(state) && txHash) break;
      }

      return NextResponse.json(
        { txHash: txHash ?? null, transactionId: created.transactionId, state },
        { status: 200 },
      );
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Circle SCA transaction failed." },
        { status: 500 },
      );
    }
  }

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(),
  });

  const account = agent.agent_wallet_address as `0x${string}`;
  const to = contractAddress as `0x${string}`;

  try {
    const [nonce, gas, fees] = await Promise.all([
      publicClient.getTransactionCount({ address: account }),
      publicClient.estimateGas({
        account,
        to,
        data: callData,
        value: BigInt(0),
      }),
      publicClient.estimateFeesPerGas(),
    ]);

    const maxFeePerGas = fees.maxFeePerGas ?? fees.gasPrice;
    const maxPriorityFeePerGas = fees.maxPriorityFeePerGas ?? fees.gasPrice;

    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      return NextResponse.json({ error: "Arc RPC did not return usable fee data." }, { status: 502 });
    }

    const { signedTransaction, txHash: circleTxHash } = await signCircleEvmTransaction({
      walletId: agent.circle_wallet_id,
      entitySecretCiphertext,
      transaction: {
        chainId: ARC_TESTNET_CHAIN_ID,
        nonce: String(nonce),
        to,
        value: "0",
        gas: String(gas),
        maxFeePerGas: String(maxFeePerGas),
        maxPriorityFeePerGas: String(maxPriorityFeePerGas),
        type: "2",
        data: callData,
      },
    });

    const txHash = await publicClient.sendRawTransaction({
      serializedTransaction: signedTransaction as `0x${string}`,
    });

    return NextResponse.json(
      {
        txHash,
        circleTxHash: circleTxHash && circleTxHash !== txHash ? circleTxHash : undefined,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Circle signing or Arc broadcast failed." },
      { status: 500 },
    );
  }
}
