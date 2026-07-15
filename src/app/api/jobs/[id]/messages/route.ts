import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const postSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

type RouteContext = { params: Promise<{ id: string }> };

async function loadJobOrFail(
  supabase: NonNullable<ReturnType<typeof getServiceClientOrResponse>["supabase"]>,
  jobId: string,
) {
  const { data, error } = await supabase
    .from(TABLES.jobs)
    .select("id,client_profile_id,provider_profile_id")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

function isParticipant(
  job: { client_profile_id: string; provider_profile_id: string | null },
  profileId: string,
) {
  return job.client_profile_id === profileId || job.provider_profile_id === profileId;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const job = await loadJobOrFail(supabase, id);
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (!isParticipant(job, session.profileId)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from(TABLES.jobMessages)
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, postSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const limited = await walletRateLimit(request, session.profileId, "jobs:message");
  if (limited) return limited;

  const job = await loadJobOrFail(supabase, id);
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (!isParticipant(job, session.profileId)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from(TABLES.jobMessages)
    .insert({
      job_id: id,
      author_profile_id: session.profileId,
      body: parsed.data.body,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  void invalidateBootstrapCache(id);
  return NextResponse.json({ message: data }, { status: 201 });
}
