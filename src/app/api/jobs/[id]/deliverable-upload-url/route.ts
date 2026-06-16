import { NextResponse } from "next/server";
import { getServiceClientOrResponse, parseJson, uploadUrlSchema, validationError } from "@/lib/api";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const DELIVERABLES_BUCKET = "deliverables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

// Issues a short-lived signed upload URL so the worker uploads the deliverable
// straight to private Storage (browser -> Supabase). Only the assigned worker
// can request one, and only while the job is in a submittable state.
export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, uploadUrlSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:upload-url");
  if (limited) return limited;

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("provider_profile_id,provider_agent_id,status")
    .eq("id", id)
    .single();

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 404 });
  if (!["funded", "submitted", "revision_requested"].includes(job.status)) {
    return NextResponse.json(
      { error: "Deliverables can only be uploaded after escrow is funded." },
      { status: 400 },
    );
  }

  // Caller must be the assigned worker (provider profile or provider-agent owner).
  let isWorker = job.provider_profile_id === session.profileId;
  if (!isWorker && job.provider_agent_id) {
    const { data: agent } = await supabase
      .from(TABLES.agents)
      .select("owner_profile_id")
      .eq("id", job.provider_agent_id)
      .single();
    isWorker = agent?.owner_profile_id === session.profileId;
  }
  if (!isWorker) {
    return NextResponse.json(
      { error: "Only the assigned worker can upload a deliverable." },
      { status: 403 },
    );
  }

  const submissionId = crypto.randomUUID();
  const path = `${id}/${submissionId}/${sanitizeFileName(parsed.data.fileName)}`;

  const { data, error } = await supabase.storage
    .from(DELIVERABLES_BUCKET)
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json(
      { error: `Could not create upload URL: ${error.message}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    submissionId,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    bucket: DELIVERABLES_BUCKET,
  });
}
