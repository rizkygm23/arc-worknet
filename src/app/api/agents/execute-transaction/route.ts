import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { getFreshEntitySecretCiphertext } from "@/lib/server/circle-wallet";
import { TABLES } from "@/lib/supabase/tables";
import crypto from "crypto";
import { env } from "@/lib/env";

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

  // 1. Fetch Agent and verify ownership
  const { data: agent, error: agentError } = await supabase
    .from(TABLES.agents)
    .select("circle_wallet_id, owner_profile_id")
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

  // 2. Generate fresh entitySecretCiphertext
  let ciphertext = "";
  try {
    ciphertext = await getFreshEntitySecretCiphertext();
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Encryption failed." }, { status: 500 });
  }

  // 3. Request Circle to execute the contract transaction
  console.log(`Executing contract transaction on Circle for wallet: ${agent.circle_wallet_id}`);
  const executeUrl = "https://api.circle.com/v1/w3s/developer/transactions/contractExecution";
  
  let transactionId = "";
  try {
    const res = await fetch(executeUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${env.CIRCLE_API_KEY}`,
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        walletId: agent.circle_wallet_id,
        feeLevel: "HIGH",
        contractAddress,
        abiFunctionSignature,
        abiParameters,
        entitySecretCiphertext: ciphertext,
      }),
      cache: "no-store",
    });

    const payload = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: payload.message || "Circle transaction execution failed." }, { status: res.status });
    }

    transactionId = payload.data?.id;
    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID not returned by Circle." }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Circle API request failed." }, { status: 500 });
  }

  // 4. Poll Circle until txHash is generated (typically within 1-5 seconds)
  console.log(`Polling transaction status for Circle ID: ${transactionId}`);
  const statusUrl = `https://api.circle.com/v1/w3s/transactions/${transactionId}`;
  let txHash = "";
  
  for (let attempt = 1; attempt <= 15; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const res = await fetch(statusUrl, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${env.CIRCLE_API_KEY}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const payload = await res.json();
        const transaction = payload.data?.transaction;
        if (transaction?.txHash) {
          txHash = transaction.txHash;
          console.log(`Found transaction hash: ${txHash}`);
          break;
        }
      }
    } catch {
      // Ignore polling errors and retry
    }
  }

  if (!txHash) {
    return NextResponse.json({
      error: "Transaction was initiated, but block transmission timed out. Check Circle Console.",
      transactionId
    }, { status: 202 });
  }

  return NextResponse.json({ txHash, transactionId }, { status: 200 });
}
