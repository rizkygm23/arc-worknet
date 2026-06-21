import { NextResponse } from "next/server";
import { ERC8183_CONTRACT_ADDRESS, erc8183Abi } from "@/lib/arc";
import { getServiceClientOrResponse, parseJson, reviewSchema, validationError } from "@/lib/api";
import { verifyArcTransaction } from "@/lib/server/arc-verify";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { encryptText } from "@/lib/server/encryption";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, reviewSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:review");
  if (limited) return limited;

  const input = parsed.data;
  if (input.reviewerProfileId !== session.profileId) {
    return NextResponse.json({ error: "Reviewer profile does not match connected wallet." }, { status: 403 });
  }

  const { data: targetJob, error: targetJobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id,arc_job_id,status")
    .eq("id", id)
    .single();

  if (targetJobError) return NextResponse.json({ error: targetJobError.message }, { status: 404 });
  if (targetJob.client_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Only the connected client wallet can review this job." }, { status: 403 });
  }
  if (!targetJob.arc_job_id) {
    return NextResponse.json({ error: "Create and fund the onchain job before reviewing work." }, { status: 400 });
  }
  if (targetJob.status !== "submitted") {
    return NextResponse.json({ error: "Only submitted work can be reviewed." }, { status: 400 });
  }

  const { data: submission, error: submissionError } = await supabase
    .from(TABLES.submissions)
    .select("id,job_id,status")
    .eq("id", input.submissionId)
    .eq("job_id", id)
    .single();

  if (submissionError) return NextResponse.json({ error: submissionError.message }, { status: 404 });
  if (submission.status !== "submitted") {
    return NextResponse.json({ error: "Submission has already been reviewed." }, { status: 400 });
  }

  if (input.decision === "reject") {
    return NextResponse.json(
      { error: "Use the reject-with-penalty endpoint to reject work." },
      { status: 400 },
    );
  }

  const expectedReviewTxMethod =
    input.decision === "approve" ? "complete" : "requestRevision";

  if (input.reviewTxMethod !== expectedReviewTxMethod) {
    return NextResponse.json({ error: "Review transaction method does not match decision." }, { status: 400 });
  }

  let blockNumber = input.blockNumber;
  try {
    const receipt = await verifyArcTransaction({
      abi: erc8183Abi,
      expectedFrom: session.walletAddress,
      expectedFunctionName: input.reviewTxMethod,
      expectedTo: ERC8183_CONTRACT_ADDRESS,
      txHash: input.reviewTxHash,
    });
    blockNumber = Number(receipt.blockNumber);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arc review transaction could not be verified." },
      { status: 400 },
    );
  }

  const status = input.decision === "approve" ? "completed" : "revision_requested";
  const submissionStatus = input.decision === "approve" ? "approved" : "revision_requested";
  const completeTxHash = input.decision === "approve" ? input.completeTxHash ?? input.reviewTxHash : null;

  const { data: review, error } = await supabase
    .from(TABLES.reviews)
    .insert({
      job_id: id,
      reviewer_profile_id: input.reviewerProfileId,
      submission_id: input.submissionId,
      rating: input.rating,
      review_text: encryptText(input.reviewText),
      reason_hash_bytes32: input.reasonHashBytes32,
      complete_tx_hash: completeTxHash,
      review_tx_hash: input.reviewTxHash,
      review_tx_method: input.reviewTxMethod,
      encrypted_at: process.env.DATA_ENCRYPTION_KEY ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from(TABLES.submissions).update({ status: submissionStatus }).eq("id", input.submissionId);
  await supabase
    .from(TABLES.jobs)
    .update({ status, complete_tx_hash: completeTxHash, last_indexed_block: blockNumber })
    .eq("id", id);

  await supabase.from(TABLES.transactions).insert({
    job_id: id,
    contract_address: ERC8183_CONTRACT_ADDRESS,
    method: input.reviewTxMethod,
    tx_hash: input.reviewTxHash,
    status: "confirmed",
    block_number: blockNumber,
    profile_id: session.profileId,
    metadata: {
      decision: input.decision,
      reason_hash_bytes32: input.reasonHashBytes32,
      submission_id: input.submissionId,
    },
    confirmed_at: new Date().toISOString(),
  });

  await invalidateBootstrapCache();
  return NextResponse.json({ review });
}
