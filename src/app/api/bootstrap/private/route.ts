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

    // Wave 1: profile + profile-scoped queries (all parallel)
    // Profile fetch is merged into the same wave instead of being sequential.
    const [
      activeProfileRow,
      ownedAgents,
      myJobs,
      profileApplications,
      notifications,
      jobInvitations,
      savedJobs,
      profileTransactions,
    ] = await Promise.all([
      supabase
        .from(TABLES.profiles)
        .select("*")
        .eq("id", session.profileId)
        .maybeSingle()
        .then(({ data }) => data),
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

    // Derive IDs from wave 1 results
    const ownedAgentIds = ownedAgents.map((a) => a.id);
    const clientJobIds = myJobs
      .filter((j) => j.client_profile_id === session.profileId)
      .map((j) => j.id);

    // Wave 2: derived-id queries + job-scoped queries (all parallel)
    // Waves 2+3 from the old code are merged into a single Promise.all.
    // We fetch agentJobs, applications, AND all job-scoped data in one shot.
    // For job-scoped queries we optimistically use myJobs IDs first, then
    // union with agentJobs IDs post-fetch for the ones that need it.
    const myJobIds = myJobs.map((j) => j.id);
    const profileAppIds = profileApplications.map((a) => a.id);

    const [
      agentJobs,
      clientApplications,
      agentApplications,
      submissions,
      reviews,
      aiEvaluations,
      privateTransactions,
      jobMessages,
      applicationOverlays,
    ] = await Promise.all([
      // Agent-provider jobs
      selectWhereIn(
        supabase
          .from(TABLES.jobs)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "provider_agent_id",
        ownedAgentIds,
      ),
      // Applications to my client jobs
      selectWhereIn(
        supabase
          .from(TABLES.applications)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "job_id",
        clientJobIds,
      ),
      // Applications by my agents
      selectWhereIn(
        supabase
          .from(TABLES.applications)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "applicant_agent_id",
        ownedAgentIds,
      ),
      // Job-scoped: submissions (use myJobIds; agentJobs fetched below)
      selectWhereIn(
        supabase
          .from(TABLES.submissions)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "job_id",
        myJobIds,
      ),
      // Job-scoped: reviews
      selectWhereIn(
        supabase
          .from(TABLES.reviews)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "job_id",
        myJobIds,
      ),
      // Job-scoped: AI evaluations
      selectWhereIn(
        supabase
          .from(TABLES.aiEvaluations)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PRIVATE_LIST_LIMIT),
        "job_id",
        myJobIds,
      ),
      // Job-scoped: transactions
      selectWhereIn(
        supabase
          .from(TABLES.transactions)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        "job_id",
        myJobIds,
      ),
      // Job-scoped: messages
      selectWhereIn(
        supabase
          .from(TABLES.jobMessages)
          .select("*")
          .order("created_at", { ascending: true })
          .limit(500),
        "job_id",
        myJobIds,
      ),
      // Application overlays (use profileAppIds optimistically)
      selectWhereIn(
        supabase
          .from(TABLES.applicationOverlay)
          .select("*"),
        "application_id",
        profileAppIds,
      ),
    ]);

    // For agent-owned jobs that weren't in myJobs, back-fill their
    // submissions/reviews/etc. Only needed if there are agent jobs
    // whose IDs are NOT already in myJobIds.
    const missingAgentJobIds = agentJobs
      .map((j) => j.id)
      .filter((id) => !myJobIds.includes(id));

    let agentSubmissions: typeof submissions = [];
    let agentReviews: typeof reviews = [];
    let agentAiEvals: typeof aiEvaluations = [];
    let agentTransactions: typeof privateTransactions = [];
    let agentMessages: typeof jobMessages = [];

    if (missingAgentJobIds.length > 0) {
      [agentSubmissions, agentReviews, agentAiEvals, agentTransactions, agentMessages] =
        await Promise.all([
          selectWhereIn(
            supabase.from(TABLES.submissions).select("*").order("created_at", { ascending: false }).limit(PRIVATE_LIST_LIMIT),
            "job_id", missingAgentJobIds,
          ),
          selectWhereIn(
            supabase.from(TABLES.reviews).select("*").order("created_at", { ascending: false }).limit(PRIVATE_LIST_LIMIT),
            "job_id", missingAgentJobIds,
          ),
          selectWhereIn(
            supabase.from(TABLES.aiEvaluations).select("*").order("created_at", { ascending: false }).limit(PRIVATE_LIST_LIMIT),
            "job_id", missingAgentJobIds,
          ),
          selectWhereIn(
            supabase.from(TABLES.transactions).select("*").order("created_at", { ascending: false }).limit(100),
            "job_id", missingAgentJobIds,
          ),
          selectWhereIn(
            supabase.from(TABLES.jobMessages).select("*").order("created_at", { ascending: true }).limit(500),
            "job_id", missingAgentJobIds,
          ),
        ]);
    }

    // Merge extra agent-scoped application IDs for overlay lookup
    const allAppIds = uniqueIds(clientApplications, profileApplications, agentApplications);
    const missingOverlayAppIds = allAppIds.filter((id) => !profileAppIds.includes(id));
    let extraOverlays: typeof applicationOverlays = [];
    if (missingOverlayAppIds.length > 0) {
      extraOverlays = await selectWhereIn(
        supabase.from(TABLES.applicationOverlay).select("*"),
        "application_id",
        missingOverlayAppIds,
      );
    }

    return NextResponse.json({
      activeProfileId: session.profileId,
      activeProfile: activeProfileRow ? mapProfile(activeProfileRow) : undefined,
      ownedAgents: ownedAgents.map(mapAgent),
      privateJobs: dedupe(myJobs, agentJobs).map(mapJob),
      applications: dedupe(clientApplications, profileApplications, agentApplications).map(mapApplication),
      submissions: dedupe(submissions, agentSubmissions).map(mapSubmission),
      reviews: dedupe(reviews, agentReviews).map(mapReview),
      aiEvaluations: dedupe(aiEvaluations, agentAiEvals).map(mapAiEvaluation),
      privateTransactions: dedupe(privateTransactions, agentTransactions).map(mapTransaction),
      profileTransactions: profileTransactions.map(mapTransaction),
      notifications: notifications.map(mapNotification),
      jobMessages: dedupe(jobMessages, agentMessages).map(mapJobMessage),
      jobInvitations: jobInvitations.map(mapJobInvitation),
      savedJobs: savedJobs.map(mapSavedJob),
      applicationOverlays: [...applicationOverlays, ...extraOverlays].map(mapApplicationOverlay),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load private data." },
      { status: 500 },
    );
  }
}
