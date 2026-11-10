import { NextResponse } from "next/server";
import { invalidPathParam, uuidParamSchema, getServiceClientOrResponse } from "@/lib/api";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const parsedId = uuidParamSchema.safeParse((await context.params).id);
  if (!parsedId.success) return invalidPathParam();

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  // The client's uploaded task document is disclosed only to the job's
  // owner, assigned provider, or applicants. Job-listing metadata
  // (filename/title) stays public; the file content does not.
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:task-file");
  if (limited) return limited;

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("task_file_path,task_file_name,client_profile_id,provider_profile_id")
    .eq("id", parsedId.data)
    .single();

  if (jobError || !job || !job.task_file_path) {
    return NextResponse.json({ error: "Task file not found." }, { status: 404 });
  }

  const isOwner =
    job.client_profile_id === session.profileId ||
    job.provider_profile_id === session.profileId;
  let hasRelationship = isOwner;
  if (!hasRelationship) {
    const { count } = await supabase
      .from(TABLES.applications)
      .select("id", { count: "exact", head: true })
      .eq("job_id", parsedId.data)
      .eq("applicant_profile_id", session.profileId);
    hasRelationship = (count ?? 0) > 0;
  }

  if (!hasRelationship) {
    return NextResponse.json({ error: "Task file not found." }, { status: 404 });
  }

  // Create a signed download URL valid for 1 hour
  const { data: signed, error: signError } = await supabase.storage
    .from("deliverables")
    .createSignedUrl(job.task_file_path, 3600, {
      download: job.task_file_name ?? true,
    });

  if (signError || !signed) {
    return NextResponse.json({ error: "Could not retrieve task file." }, { status: 502 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
export const dynamic = "force-dynamic";
