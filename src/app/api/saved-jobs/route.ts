import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const postSchema = z.object({
  jobId: z.string().uuid(),
});

export async function GET() {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const { data, error } = await supabase
    .from(TABLES.savedJobs)
    .select("*")
    .eq("profile_id", session.profileId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ savedJobs: data ?? [] });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, postSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:save");
  if (limited) return limited;

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("id")
    .eq("id", parsed.data.jobId)
    .maybeSingle();
  if (jobError || !job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  const { data, error } = await supabase
    .from(TABLES.savedJobs)
    .upsert(
      { profile_id: session.profileId, job_id: parsed.data.jobId },
      { onConflict: "profile_id,job_id", ignoreDuplicates: false },
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  void invalidateBootstrapCache();
  return NextResponse.json({ savedJob: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
    return NextResponse.json({ error: "Missing or invalid jobId." }, { status: 400 });
  }

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const { error } = await supabase
    .from(TABLES.savedJobs)
    .delete()
    .eq("profile_id", session.profileId)
    .eq("job_id", jobId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  void invalidateBootstrapCache();
  return NextResponse.json({ ok: true });
}
