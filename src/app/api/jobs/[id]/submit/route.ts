import { NextResponse } from "next/server";
import { ERC8183_CONTRACT_ADDRESS, erc8183Abi } from "@/lib/arc";
import { getServiceClientOrResponse, parseJson, submitSchema, validationError } from "@/lib/api";
import { verifyArcTransaction } from "@/lib/server/arc-verify";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { encryptJson, encryptText } from "@/lib/server/encryption";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, submitSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:submit");
  if (limited) return limited;

  const input = parsed.data;
  const { data: targetJob, error: targetJobError } = await supabase
    .from(TABLES.jobs)
    .select("provider_profile_id,provider_agent_id,arc_job_id,status")
    .eq("id", id)
    .single();

  if (targetJobError) return NextResponse.json({ error: targetJobError.message }, { status: 404 });
  if (!targetJob.arc_job_id) {
    return NextResponse.json({ error: "Create and fund the onchain job before submitting deliverables." }, { status: 400 });
  }
  if (!["funded", "submitted", "revision_requested"].includes(targetJob.status)) {
    return NextResponse.json({ error: "Deliverables can only be submitted after escrow is funded." }, { status: 400 });
  }
  if (targetJob.provider_profile_id && targetJob.provider_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Only the accepted provider wallet can submit deliverables." }, { status: 403 });
  }
  
  let expectedFrom = session.walletAddress;
  if (targetJob.provider_agent_id) {
    const { data: agent, error: agentError } = await supabase
      .from(TABLES.agents)
      .select("owner_profile_id,agent_wallet_address")
      .eq("id", targetJob.provider_agent_id)
      .single();

    if (agentError) return NextResponse.json({ error: agentError.message }, { status: 404 });
    if (agent.owner_profile_id !== session.profileId) {
      return NextResponse.json({ error: "Only the accepted agent owner wallet can submit deliverables." }, { status: 403 });
    }
    if (agent.agent_wallet_address) {
      expectedFrom = agent.agent_wallet_address;
    }
  }

  let blockNumber = input.blockNumber;
  try {
    const receipt = await verifyArcTransaction({
      abi: erc8183Abi,
      expectedFrom,
      expectedFunctionName: "submit",
      expectedTo: ERC8183_CONTRACT_ADDRESS,
      txHash: input.submitTxHash,
    });
    blockNumber = Number(receipt.blockNumber);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arc submit transaction could not be verified." },
      { status: 400 },
    );
  }

  const { data: submission, error } = await supabase
    .from(TABLES.submissions)
    .insert({
      job_id: id,
      submitter_profile_id: targetJob.provider_profile_id ? session.profileId : input.submitterProfileId,
      submitter_agent_id: targetJob.provider_agent_id ?? input.submitterAgentId,
      notes: encryptText(input.notes),
      deliverable_url: input.deliverableUrl ? encryptText(input.deliverableUrl) : null,
      deliverable_storage_path: input.deliverableStoragePath ?? null,
      deliverable_sha256: input.deliverableSha256 ?? null,
      deliverable_payload: encryptJson(input.deliverablePayload),
      deliverable_hash_bytes32: input.deliverableHashBytes32,
      submit_tx_hash: input.submitTxHash,
      encrypted_at: process.env.DATA_ENCRYPTION_KEY ? new Date().toISOString() : null,
      status: "submitted",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from(TABLES.jobs)
    .update({ status: "submitted", submit_tx_hash: input.submitTxHash, last_indexed_block: blockNumber })
    .eq("id", id);

  await supabase.from(TABLES.transactions).insert({
    job_id: id,
    contract_address: ERC8183_CONTRACT_ADDRESS,
    method: "submit",
    tx_hash: input.submitTxHash,
    status: "confirmed",
    block_number: blockNumber,
    profile_id: session.profileId,
    metadata: { deliverable_hash_bytes32: input.deliverableHashBytes32 },
    confirmed_at: new Date().toISOString(),
  });

  void invalidateBootstrapCache(id);
  return NextResponse.json({ submission }, { status: 201 });
}
