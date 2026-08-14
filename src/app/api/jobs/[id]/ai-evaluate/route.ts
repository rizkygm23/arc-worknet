import { NextResponse } from "next/server";
import { aiEvaluateSchema, getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { evaluateDeliverableWithAi } from "@/lib/server/ai-evaluator";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { decryptJson, decryptText } from "@/lib/server/encryption";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { mapAiEvaluation } from "@/lib/supabase/mappers";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, aiEvaluateSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const limited = await walletRateLimit(request, session.profileId, "jobs:ai-evaluate");
  if (limited) return limited;

  // 1. Fetch Job
  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("id,title,brief,acceptance_criteria,deliverable_format,category,tags,client_profile_id,provider_profile_id,provider_agent_id,status")
    .eq("id", id)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message || "Job not found." }, { status: 404 });
  }

  // 2. Auth check: Must be client, provider, or provider agent owner
  let ownsProviderAgent = false;
  if (job.provider_agent_id) {
    const { data: agent } = await supabase
      .from(TABLES.agents)
      .select("owner_profile_id")
      .eq("id", job.provider_agent_id)
      .single();
    if (agent && agent.owner_profile_id === session.profileId) {
      ownsProviderAgent = true;
    }
  }

  const isClient = job.client_profile_id === session.profileId;
  const isProvider = job.provider_profile_id === session.profileId;

  if (!isClient && !isProvider && !ownsProviderAgent) {
    return NextResponse.json(
      { error: "Only job participants (client or assigned provider) can trigger AI evaluation." },
      { status: 403 },
    );
  }

  // 3. Fetch target Submission
  let submissionQuery = supabase
    .from(TABLES.submissions)
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  if (parsed.data.submissionId) {
    submissionQuery = submissionQuery.eq("id", parsed.data.submissionId);
  }

  const { data: submissions, error: subError } = await submissionQuery;
  if (subError || !submissions || submissions.length === 0) {
    return NextResponse.json({ error: "No submission found to evaluate." }, { status: 404 });
  }

  const submission = submissions[0];

  // 4. Decrypt submission details
  const decryptedNotes = decryptText(submission.notes);
  const decryptedUrl = decryptText(submission.deliverable_url);
  const decryptedPayload = decryptJson(submission.deliverable_payload);
  const fileMeta = (decryptedPayload?.fileMeta ?? {}) as {
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
  };

  // 5. Run AI Evaluator Engine
  const evaluationResult = await evaluateDeliverableWithAi(
    {
      title: job.title,
      brief: job.brief,
      acceptanceCriteria: job.acceptance_criteria,
      deliverableFormat: job.deliverable_format,
      category: job.category,
      tags: job.tags,
    },
    {
      notes: decryptedNotes,
      deliverableUrl: decryptedUrl,
      deliverableFileName: fileMeta.fileName,
      deliverableMimeType: fileMeta.mimeType,
      deliverableSizeBytes: fileMeta.sizeBytes,
      deliverableSha256: submission.deliverable_sha256,
      deliverablePayload: decryptedPayload,
    },
  );

  // 6. Delete previous evaluation for this submission if exists, then insert new one
  await supabase
    .from(TABLES.aiEvaluations)
    .delete()
    .eq("submission_id", submission.id);

  const { data: savedEvaluation, error: insertError } = await supabase
    .from(TABLES.aiEvaluations)
    .insert({
      job_id: id,
      submission_id: submission.id,
      model: evaluationResult.model,
      score: evaluationResult.score,
      verdict: evaluationResult.verdict,
      summary: evaluationResult.summary,
      rubric: evaluationResult.rubric as unknown as Record<string, unknown>,
      raw_output: (evaluationResult.rawOutput ?? {}) as unknown as Record<string, unknown>,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  void invalidateBootstrapCache(id);

  return NextResponse.json(
    {
      evaluation: mapAiEvaluation(savedEvaluation),
    },
    { status: 201 },
  );
}

export const dynamic = "force-dynamic";
