import { NextResponse } from "next/server";
import { ARC_USDC_ADDRESS, ERC8183_CONTRACT_ADDRESS, erc20UsdcAbi, erc8183Abi } from "@/lib/arc";
import { getServiceClientOrResponse, parseJson, updateTxSchema, validationError } from "@/lib/api";
import { verifyArcTransaction } from "@/lib/server/arc-verify";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const fundSchema = updateTxSchema.extend({
  approveTxHash: updateTxSchema.shape.txHash.optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, fundSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:fund");
  if (limited) return limited;

  const { data: targetJob, error: targetJobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id,status")
    .eq("id", id)
    .single();

  if (targetJobError) return NextResponse.json({ error: targetJobError.message }, { status: 404 });
  if (targetJob.client_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Only the connected client wallet can fund escrow." }, { status: 403 });
  }
  if (targetJob.status !== "budget_set" && targetJob.status !== "funding_pending") {
    return NextResponse.json({ error: "Escrow can only be funded after the budget is set." }, { status: 400 });
  }

  let blockNumber = parsed.data.blockNumber;
  try {
    if (parsed.data.approveTxHash) {
      await verifyArcTransaction({
        abi: erc20UsdcAbi,
        expectedFrom: session.walletAddress,
        expectedFunctionName: "approve",
        expectedTo: ARC_USDC_ADDRESS,
        txHash: parsed.data.approveTxHash,
      });
    }
    const receipt = await verifyArcTransaction({
      abi: erc8183Abi,
      expectedFrom: session.walletAddress,
      expectedFunctionName: "fund",
      expectedTo: ERC8183_CONTRACT_ADDRESS,
      txHash: parsed.data.txHash,
    });
    blockNumber = Number(receipt.blockNumber);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arc fund transaction could not be verified." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from(TABLES.jobs)
    .update({
      status: "funded",
      approve_tx_hash: parsed.data.approveTxHash,
      fund_tx_hash: parsed.data.txHash,
      last_indexed_block: blockNumber,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.approveTxHash) {
    await supabase.from(TABLES.transactions).insert({
      job_id: id,
      contract_address: ERC8183_CONTRACT_ADDRESS,
      method: "approve",
      tx_hash: parsed.data.approveTxHash,
      status: "confirmed",
      block_number: blockNumber,
      profile_id: session.profileId,
      confirmed_at: new Date().toISOString(),
    });
  }

  await supabase.from(TABLES.transactions).insert({
    job_id: id,
    contract_address: ERC8183_CONTRACT_ADDRESS,
    method: "fund",
    tx_hash: parsed.data.txHash,
    status: "confirmed",
    block_number: blockNumber,
    profile_id: session.profileId,
    confirmed_at: new Date().toISOString(),
  });

  await invalidateBootstrapCache();
  return NextResponse.json({ job: data });
}
