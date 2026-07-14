import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient, encodeFunctionData, http, parseAbiItem } from "viem";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { getFreshEntitySecretCiphertext, signCircleEvmTransaction } from "@/lib/server/circle-wallet";
import { TABLES } from "@/lib/supabase/tables";
import { ARC_TESTNET_CHAIN_ID, arcTestnet } from "@/lib/arc";

const executeTransactionSchema = z.object({
  agentId: z.string().uuid(),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  abiFunctionSignature: z.string().min(3),
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

  const { data: agent, error: agentError } = await supabase
    .from(TABLES.agents)
    .select("circle_wallet_id, agent_wallet_address, owner_profile_id")
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

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(),
  });

  const account = agent.agent_wallet_address as `0x${string}`;
  const to = contractAddress as `0x${string}`;

  try {
    const data = encodeFunctionData({
      abi: [parseAbiItem(`function ${abiFunctionSignature}`)],
      args: abiParameters,
      functionName: abiFunctionSignature.slice(0, abiFunctionSignature.indexOf("(")),
    });

    const [nonce, gas, fees] = await Promise.all([
      publicClient.getTransactionCount({ address: account }),
      publicClient.estimateGas({
        account,
        to,
        data,
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
        data,
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
