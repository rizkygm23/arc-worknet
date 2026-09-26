import { NextResponse } from "next/server";
import {
  dbServerError,
  invalidPathParam,
  uuidParamSchema,
  getServiceClientOrResponse,
} from "@/lib/api";
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
  const parsedId = uuidParamSchema.safeParse((await context.params).id);
  if (!parsedId.success) return invalidPathParam();
  const id = parsedId.data;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { data: jobRow, error } = await supabase
    .from(TABLES.jobs)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const jobError = dbServerError("jobs.get", error);
  if (jobError) return jobError;
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

  const profilesError = dbServerError("jobs.get.profiles", profilesResult.error);
  if (profilesError) return profilesError;
  const agentError = dbServerError("jobs.get.agent", agentResult.error);
  if (agentError) return agentError;

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
    const applicationsError = dbServerError("jobs.get.applications", applicationsResult.error);
    if (applicationsError) return applicationsError;
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
    const submissionsError = dbServerError("jobs.get.submissions", submissionsResult.error);
    if (submissionsError) return submissionsError;
    submissionRows = submissionsResult.data ?? [];

    const submissionIds = submissionRows.map((row) => row.id as string);
    if (submissionIds.length > 0) {
      const evaluationsResult = await supabase
        .from(TABLES.aiEvaluations)
        .select("*")
        .in("submission_id", submissionIds)
        .order("created_at", { ascending: false });
      const evaluationsError = dbServerError("jobs.get.evaluations", evaluationsResult.error);
      if (evaluationsError) return evaluationsError;
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
