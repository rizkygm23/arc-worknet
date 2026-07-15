import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { getWalletSession } from "@/lib/server/wallet-session";
import {
  mapAgent,
  mapAiEvaluation,
  mapApplication,
  mapJob,
  mapProfile,
  mapSubmission,
} from "@/lib/supabase/mappers";
import { TABLES } from "@/lib/supabase/tables";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { data: jobRow, error } = await supabase
    .from(TABLES.jobs)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return noStore({ error: error.message }, 500);
  if (!jobRow) return noStore({ error: "Job not found." }, 404);

  const session = await getWalletSession(supabase);
  const isClient = session?.profileId === jobRow.client_profile_id;
  const isProvider = session?.profileId === jobRow.provider_profile_id;

  const profileIds = [jobRow.client_profile_id, jobRow.provider_profile_id].filter(
    (value): value is string => Boolean(value),
  );
  const [profilesResult, agentResult] = await Promise.all([
    supabase.from(TABLES.profiles).select("*").in("id", profileIds),
    jobRow.provider_agent_id
      ? supabase.from(TABLES.agents).select("*").eq("id", jobRow.provider_agent_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (profilesResult.error) return noStore({ error: profilesResult.error.message }, 500);
  if (agentResult.error) return noStore({ error: agentResult.error.message }, 500);

  const ownsProviderAgent = Boolean(
    session && agentResult.data?.owner_profile_id === session.profileId,
  );
  const isParticipant = isClient || isProvider || ownsProviderAgent;

  let applicationRows: Array<Parameters<typeof mapApplication>[0]> = [];
  if (session) {
    let applicationQuery = supabase
      .from(TABLES.applications)
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    if (!isClient) applicationQuery = applicationQuery.eq("applicant_profile_id", session.profileId);
    const applicationsResult = await applicationQuery;
    if (applicationsResult.error) return noStore({ error: applicationsResult.error.message }, 500);
    applicationRows = applicationsResult.data ?? [];
  }

  let submissionRows: Array<Parameters<typeof mapSubmission>[0]> = [];
  let evaluationRows: Array<Parameters<typeof mapAiEvaluation>[0]> = [];
  if (isParticipant) {
    const submissionsResult = await supabase
      .from(TABLES.submissions)
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    if (submissionsResult.error) return noStore({ error: submissionsResult.error.message }, 500);
    submissionRows = submissionsResult.data ?? [];

    const submissionIds = submissionRows.map((row) => row.id as string);
    if (submissionIds.length > 0) {
      const evaluationsResult = await supabase
        .from(TABLES.aiEvaluations)
        .select("*")
        .in("submission_id", submissionIds)
        .order("created_at", { ascending: false });
      if (evaluationsResult.error) return noStore({ error: evaluationsResult.error.message }, 500);
      evaluationRows = evaluationsResult.data ?? [];
    }
  }

  return noStore({
    job: mapJob(jobRow),
    profiles: (profilesResult.data ?? []).map(mapProfile),
    agents: agentResult.data ? [mapAgent(agentResult.data)] : [],
    applications: applicationRows.map(mapApplication),
    submissions: submissionRows.map(mapSubmission),
    aiEvaluations: evaluationRows.map(mapAiEvaluation),
  });
}
