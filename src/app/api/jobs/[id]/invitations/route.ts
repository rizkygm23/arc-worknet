import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const inviteSchema = z.object({
  toWorkerProfileId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, inviteSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id: jobId } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:invite");
  if (limited) return limited;

  const { toWorkerProfileId, message } = parsed.data;
  if (toWorkerProfileId === session.profileId) {
    return NextResponse.json({ error: "Cannot invite yourself." }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id,status")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError || !job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (job.client_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Only the job owner can invite." }, { status: 403 });
  }
  if (!["open", "draft"].includes(job.status)) {
    return NextResponse.json({ error: "Job is no longer accepting invitations." }, { status: 400 });
  }

  const { data: worker, error: workerError } = await supabase
    .from(TABLES.profiles)
    .select("id,is_blocked")
    .eq("id", toWorkerProfileId)
    .maybeSingle();
  if (workerError || !worker) return NextResponse.json({ error: "Worker not found." }, { status: 404 });
  if (worker.is_blocked) return NextResponse.json({ error: "Worker not available." }, { status: 400 });

  const { data, error } = await supabase
    .from(TABLES.jobInvitations)
    .insert({
      job_id: jobId,
      from_client_profile_id: session.profileId,
      to_worker_profile_id: toWorkerProfileId,
      message,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Invitation already pending." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidateBootstrapCache();
  return NextResponse.json({ invitation: data }, { status: 201 });
}
