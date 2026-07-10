import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";

export const dynamic = "force-dynamic";
import { getWalletSession } from "@/lib/server/wallet-session";
import {
  mapAgent,
  mapAiEvaluation,
  mapApplication,
  mapApplicationOverlay,
  mapJob,
  mapJobInvitation,
  mapJobMessage,
  mapNotification,
  mapProfile,
  mapReview,
  mapSavedJob,
  mapSubmission,
  mapTransaction,
} from "@/lib/supabase/mappers";
import { TABLES } from "@/lib/supabase/tables";

const PRIVATE_LIST_LIMIT = 200;

async function selectTable<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function selectWhereIn<T>(
  query: { in: (column: string, values: string[]) => PromiseLike<{ data: T[] | null; error: { message: string } | null }> },
  column: string,
  values: string[],
) {
  if (values.length === 0) return [] as T[];
  return selectTable<T>(query.in(column, values));
}

function uniqueIds<T extends { id: string }>(...sets: T[][]) {
  const seen = new Set<string>();
  for (const set of sets) for (const item of set) seen.add(item.id);
  return Array.from(seen);
}

function dedupe<T extends { id: string }>(...sets: T[][]) {
  const map = new Map<string, T>();
  for (const set of sets) for (const item of set) map.set(item.id, item);
  return Array.from(map.values());
}

export async function GET() {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  try {
    const session = await getWalletSession(supabase);
    if (!session) {
      return NextResponse.json({ session: null });
    }

    const { data: activeProfileRow } = await supabase
      .from(TABLES.profiles)
      .select("*")
      .eq("id", session.profileId)
      .maybeSingle();

    // Wave 1: profile-scoped queries (parallel)
    //
    // Jobs where I'm the client OR the human provider are fetched in a single
    // round-trip via .or() instead of two separate .eq() queries. Jobs where
    // one of my AGENTS is the provider are NOT covered here — accept-application
    // leaves provider_profile_id null for agent providers — so those still come
    // from the provider_agent_id lookup in wave 2.
    const [
      ownedAgents,
      myJobs,
      profileApplications,
      notifications,
      jobInvitations,
      savedJobs,
      profileTransactions,
    ] = await Promise.all([
      selectTable(
        supabase
          .from(TABLES.agents)
          .select("*")
          .eq("owner_profile_id", session.profileId)
          .order("created_at", { ascending: false }),
      ),
      selectTable(
        supabase
          .from(TABLES.jobs)
          .select("*")
          .or(
            `client_profile_id.eq.${session.profileId},provider_profile_id.eq.${session.profileId}`,
          )
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
      ),
      selectTable(
        supabase
          .from(TABLES.applications)
          .select("*")
          .eq("applicant_profile_id", session.profileId)
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
      ),
      selectTable(
        supabase
          .from(TABLES.notifications)
          .select("*")
          .eq("profile_id", session.profileId)
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
      ),
      selectTable(
        supabase
          .from(TABLES.jobInvitations)
          .select("*")
          .or(
            `to_worker_profile_id.eq.${session.profileId},from_client_profile_id.eq.${session.profileId}`,
          )
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
      ),
      selectTable(
        supabase
          .from(TABLES.savedJobs)
          .select("*")
          .eq("profile_id", session.profileId)
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
      ),
      selectTable(
        supabase
          .from(TABLES.transactions)
          .select("*")
          .eq("profile_id", session.profileId)
          .order("created_at", { ascending: false })
          .limit(100),
      ),
    ]);

    const ownedAgentIds = ownedAgents.map((a) => a.id);
    // clientApplications looks up applications TO jobs I posted. Only my client
    // jobs are relevant here (applicants apply to a client's posting), so filter
    // the merged myJobs set down to the ones I own as client.
    const clientJobIds = myJobs
      .filter((j) => j.client_profile_id === session.profileId)
      .map((j) => j.id);

    // Wave 2: derived-id queries (parallel)
    const [agentJobs, clientApplications, agentApplications] = await Promise.all([
      selectWhereIn(
        supabase
          .from(TABLES.jobs)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "provider_agent_id",
        ownedAgentIds,
      ),
      selectWhereIn(
        supabase
          .from(TABLES.applications)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "job_id",
        clientJobIds,
      ),
      selectWhereIn(
        supabase
          .from(TABLES.applications)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "applicant_agent_id",
        ownedAgentIds,
      ),
    ]);

    const privateJobIds = uniqueIds(myJobs, agentJobs);
    const userApplicationIds = uniqueIds(
      clientApplications,
      profileApplications,
      agentApplications,
    );

    // Wave 3: job-id-scoped queries (parallel)
    const [
      submissions,
      reviews,
      aiEvaluations,
      privateTransactions,
      jobMessages,
      applicationOverlays,
    ] = await Promise.all([
      selectWhereIn(
        supabase
          .from(TABLES.submissions)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "job_id",
        privateJobIds,
      ),
      selectWhereIn(
        supabase
          .from(TABLES.reviews)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "job_id",
        privateJobIds,
      ),
      selectWhereIn(
        supabase
          .from(TABLES.aiEvaluations)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "job_id",
        privateJobIds,
      ),
      selectWhereIn(
        supabase
          .from(TABLES.transactions)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        "job_id",
        privateJobIds,
      ),
      selectWhereIn(
        supabase
          .from(TABLES.jobMessages)
          .select("*")
          .order("created_at", { ascending: true })
          .limit(500),
        "job_id",
        privateJobIds,
      ),
      selectWhereIn(
        supabase
          .from(TABLES.applicationOverlay)
          .select("*"),
        "application_id",
        userApplicationIds,
      ),
    ]);

    return NextResponse.json({
      activeProfileId: session.profileId,
      activeProfile: activeProfileRow ? mapProfile(activeProfileRow) : undefined,
      ownedAgents: ownedAgents.map(mapAgent),
      privateJobs: dedupe(myJobs, agentJobs).map(mapJob),
      applications: dedupe(clientApplications, profileApplications, agentApplications).map(mapApplication),
      submissions: submissions.map(mapSubmission),
      reviews: reviews.map(mapReview),
      aiEvaluations: aiEvaluations.map(mapAiEvaluation),
      privateTransactions: privateTransactions.map(mapTransaction),
      profileTransactions: profileTransactions.map(mapTransaction),
      notifications: notifications.map(mapNotification),
      jobMessages: jobMessages.map(mapJobMessage),
      jobInvitations: jobInvitations.map(mapJobInvitation),
      savedJobs: savedJobs.map(mapSavedJob),
      applicationOverlays: applicationOverlays.map(mapApplicationOverlay),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load private data." },
      { status: 500 },
    );
  }
}
