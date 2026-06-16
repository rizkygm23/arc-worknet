import { NextResponse } from "next/server";
import { ERC8183_CONTRACT_ADDRESS, erc8183Abi } from "@/lib/arc";
import {
  getServiceClientOrResponse,
  parseJson,
  raiseDisputeSchema,
  validationError,
} from "@/lib/api";
import { verifyArcTransaction } from "@/lib/server/arc-verify";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Worker-initiated dispute. The escrow contract allows the provider (worker) to
// call raiseDispute directly, but the previous UI only exposed it to the client.
// This route lets the assigned worker freeze the escrow when a client refuses to
// approve clearly-finished work — protecting the worker, not just the client.
export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, raiseDisputeSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:raise-dispute");
  if (limited) return limited;

  const input = parsed.data;

  const { data: targetJob, error: targetJobError } = await supabase
    .from(TABLES.jobs)
    .select("arc_job_id,status,provider_profile_id,provider_agent_id")
    .eq("id", id)
    .single();

  if (targetJobError) return NextResponse.json({ error: targetJobError.message }, { status: 404 });
  if (!targetJob.arc_job_id) {
    return NextResponse.json({ error: "This job is not funded onchain yet." }, { status: 400 });
  }
  if (!["funded", "submitted", "revision_requested"].includes(targetJob.status)) {
    return NextResponse.json(
      { error: "You can only open a dispute on funded or submitted work." },
      { status: 400 },
    );
  }

  // Confirm the caller is the assigned worker — either the provider profile, or
  // the owner of the provider agent.
  let isWorker = targetJob.provider_profile_id === session.profileId;
  if (!isWorker && targetJob.provider_agent_id) {
    const { data: agent } = await supabase
      .from(TABLES.agents)
      .select("owner_profile_id")
      .eq("id", targetJob.provider_agent_id)
      .single();
    isWorker = agent?.owner_profile_id === session.profileId;
  }
  if (!isWorker) {
    return NextResponse.json(
      { error: "Only the assigned worker can open this dispute." },
      { status: 403 },
    );
  }

  let blockNumber = input.blockNumber;
  try {
    const receipt = await verifyArcTransaction({
      abi: erc8183Abi,
      expectedFrom: session.walletAddress,
      expectedFunctionName: "raiseDispute",
      expectedTo: ERC8183_CONTRACT_ADDRESS,
      txHash: input.disputeTxHash,
    });
    blockNumber = Number(receipt.blockNumber);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Arc raiseDispute transaction could not be verified.",
      },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from(TABLES.jobs)
    .update({ status: "disputed", last_indexed_block: blockNumber })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await supabase.from(TABLES.transactions).insert({
    job_id: id,
    contract_address: ERC8183_CONTRACT_ADDRESS,
    method: "raiseDispute",
    tx_hash: input.disputeTxHash,
    status: "confirmed",
    block_number: blockNumber,
    profile_id: session.profileId,
    metadata: {
      raised_by: "worker",
      reason_hash_bytes32: input.reasonHashBytes32,
    },
    confirmed_at: new Date().toISOString(),
  });

  await invalidateBootstrapCache();
  return NextResponse.json({ ok: true, status: "disputed" });
}
