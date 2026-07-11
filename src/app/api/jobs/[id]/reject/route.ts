import { NextResponse } from "next/server";
import { ERC8183_CONTRACT_ADDRESS, erc8183Abi } from "@/lib/arc";
import { getServiceClientOrResponse, parseJson, rejectSchema, validationError } from "@/lib/api";
import { verifyArcTransaction } from "@/lib/server/arc-verify";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { encryptText } from "@/lib/server/encryption";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const REJECTION_PENALTY_BPS = 500; // 5% to the worker, mirrors the contract.
const BPS_DENOMINATOR = 10_000;

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Trustless rejection. The client rejects submitted work and, in the same
// onchain tx (rejectWithPenalty), pays the worker a 5% penalty and is refunded
// 95%. No owner/admin/arbiter is involved — the client signs it directly.
export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, rejectSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:reject");
  if (limited) return limited;

  const input = parsed.data;
  if (input.reviewerProfileId !== session.profileId) {
    return NextResponse.json(
      { error: "Reviewer profile does not match connected wallet." },
      { status: 403 },
    );
  }

  const { data: targetJob, error: targetJobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id,arc_job_id,status,budget_usdc_units")
    .eq("id", id)
    .single();

  if (targetJobError) return NextResponse.json({ error: targetJobError.message }, { status: 404 });
  if (targetJob.client_profile_id !== session.profileId) {
    return NextResponse.json(
      { error: "Only the connected client wallet can reject this work." },
      { status: 403 },
    );
  }
  if (!targetJob.arc_job_id) {
    return NextResponse.json(
      { error: "Create and fund the onchain job before rejecting work." },
      { status: 400 },
    );
  }
  if (targetJob.status !== "submitted") {
    return NextResponse.json({ error: "Only submitted work can be rejected." }, { status: 400 });
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

  let blockNumber = input.blockNumber;
  try {
    const receipt = await verifyArcTransaction({
      abi: erc8183Abi,
      expectedFrom: session.walletAddress,
      expectedFunctionName: "rejectWithPenalty",
      expectedTo: ERC8183_CONTRACT_ADDRESS,
      txHash: input.rejectTxHash,
    });
    blockNumber = Number(receipt.blockNumber);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Arc rejectWithPenalty transaction could not be verified.",
      },
      { status: 400 },
    );
  }

  const budget = targetJob.budget_usdc_units ?? 0;
  const workerPenalty = Math.floor((budget * REJECTION_PENALTY_BPS) / BPS_DENOMINATOR);
  const clientRefund = budget - workerPenalty;

  const { data: review, error: reviewError } = await supabase
    .from(TABLES.reviews)
    .insert({
      job_id: id,
      reviewer_profile_id: input.reviewerProfileId,
      submission_id: input.submissionId,
      rating: 1,
      review_text: encryptText(input.reasonText),
      reason_hash_bytes32: input.reasonHashBytes32,
      review_tx_hash: input.rejectTxHash,
      review_tx_method: "rejectWithPenalty",
      encrypted_at: process.env.DATA_ENCRYPTION_KEY ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 });

  await supabase
    .from(TABLES.submissions)
    .update({ status: "rejected" })
    .eq("id", input.submissionId);

  await supabase
    .from(TABLES.jobs)
    .update({
      status: "rejected",
      complete_tx_hash: input.rejectTxHash,
      last_indexed_block: blockNumber,
    })
    .eq("id", id);

  await supabase.from(TABLES.transactions).insert({
    job_id: id,
    contract_address: ERC8183_CONTRACT_ADDRESS,
    method: "rejectWithPenalty",
    tx_hash: input.rejectTxHash,
    status: "confirmed",
    block_number: blockNumber,
    profile_id: session.profileId,
    metadata: {
      worker_penalty_usdc_units: workerPenalty,
      client_refund_usdc_units: clientRefund,
      reason_hash_bytes32: input.reasonHashBytes32,
    },
    confirmed_at: new Date().toISOString(),
  });

  void invalidateBootstrapCache();
  return NextResponse.json({ review, workerPenalty, clientRefund });
}
