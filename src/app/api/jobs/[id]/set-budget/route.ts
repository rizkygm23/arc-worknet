import { NextResponse } from "next/server";
import { ERC8183_CONTRACT_ADDRESS, erc8183Abi } from "@/lib/arc";
import { getServiceClientOrResponse, parseJson, updateTxSchema, validationError } from "@/lib/api";
import { verifyArcTransaction } from "@/lib/server/arc-verify";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, updateTxSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:set-budget");
  if (limited) return limited;

  const { data: targetJob, error: targetJobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id,status")
    .eq("id", id)
    .single();

  if (targetJobError) return NextResponse.json({ error: targetJobError.message }, { status: 404 });
  if (targetJob.client_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Only the connected client wallet can set budget." }, { status: 403 });
  }
  if (targetJob.status !== "onchain_created") {
    return NextResponse.json({ error: "Budget can only be set after the onchain job is created." }, { status: 400 });
  }

  let blockNumber = parsed.data.blockNumber;
  try {
    const receipt = await verifyArcTransaction({
      abi: erc8183Abi,
      expectedFrom: session.walletAddress,
      expectedFunctionName: "setBudget",
      expectedTo: ERC8183_CONTRACT_ADDRESS,
      txHash: parsed.data.txHash,
    });
    blockNumber = Number(receipt.blockNumber);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arc setBudget transaction could not be verified." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from(TABLES.jobs)
    .update({
      status: "budget_set",
      set_budget_tx_hash: parsed.data.txHash,
      last_indexed_block: blockNumber,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from(TABLES.transactions).insert({
    job_id: id,
    contract_address: ERC8183_CONTRACT_ADDRESS,
    method: "setBudget",
    tx_hash: parsed.data.txHash,
    status: "confirmed",
    block_number: blockNumber,
    profile_id: session.profileId,
    confirmed_at: new Date().toISOString(),
  });

  void invalidateBootstrapCache(id);
  return NextResponse.json({ job: data });
}
