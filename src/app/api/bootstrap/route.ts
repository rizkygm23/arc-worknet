import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { getWalletSession } from "@/lib/server/wallet-session";
import { toWorkNetState, type BootstrapRows } from "@/lib/supabase/mappers";
import { TABLES } from "@/lib/supabase/tables";

const PUBLIC_JOB_STATUSES = [
  "open",
  "assigned",
  "onchain_created",
  "budget_set",
  "funded",
  "submitted",
  "revision_requested",
  "completed",
] as const;

type PublicBootstrapRows = Pick<
  BootstrapRows,
  "profiles" | "agents" | "jobs" | "transactions" | "events"
>;

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

function mergeUnique<T extends { id: string }>(...sets: T[][]) {
  return Array.from(new Map(sets.flat().map((item) => [item.id, item])).values());
}

async function loadPublicRows(supabase: ReturnType<typeof getServiceClientOrResponse>["supabase"]) {
  if (!supabase) throw new Error("Supabase service client is not available.");

  const [profiles, agents, jobs, events] = await Promise.all([
    selectTable(
      supabase
        .from(TABLES.profiles)
        .select("*")
        .eq("is_blocked", false)
        .order("created_at", { ascending: false }),
    ),
    selectTable(
      supabase
        .from(TABLES.agents)
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false }),
    ),
    selectTable(
      supabase
        .from(TABLES.jobs)
        .select("*")
        .in("status", [...PUBLIC_JOB_STATUSES])
        .order("created_at", { ascending: false }),
    ),
    selectTable(
      supabase
        .from(TABLES.events)
        .select("*")
        .order("block_number", { ascending: false })
        .limit(200),
    ),
  ]);
  const publicJobIds = jobs.map((job) => job.id);
  const transactions = await selectWhereIn(
    supabase
      .from(TABLES.transactions)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    "job_id",
    publicJobIds,
  );

  return { profiles, agents, jobs, transactions, events } satisfies PublicBootstrapRows;
}

export async function GET() {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  try {
    const session = await getWalletSession(supabase);
    const publicRows = await loadPublicRows(supabase);

    if (!session) {
      const rows: BootstrapRows = {
        ...publicRows,
        applications: [],
        submissions: [],
        reviews: [],
        aiEvaluations: [],
        notifications: [],
        jobMessages: [],
        jobInvitations: [],
        savedJobs: [],
        applicationOverlays: [],
      };
      return NextResponse.json({ state: toWorkNetState(rows) });
    }

    const ownedAgents = await selectTable(
      supabase
        .from(TABLES.agents)
        .select("*")
        .eq("owner_profile_id", session.profileId)
        .order("created_at", { ascending: false }),
    );
    const ownedAgentIds = ownedAgents.map((agent) => agent.id);

    const [clientJobs, providerJobs, agentJobs] = await Promise.all([
      selectTable(
        supabase
          .from(TABLES.jobs)
          .select("*")
          .eq("client_profile_id", session.profileId)
          .order("created_at", { ascending: false }),
      ),
      selectTable(
        supabase
          .from(TABLES.jobs)
          .select("*")
          .eq("provider_profile_id", session.profileId)
          .order("created_at", { ascending: false }),
      ),
      selectWhereIn(
        supabase
          .from(TABLES.jobs)
          .select("*")
          .order("created_at", { ascending: false }),
        "provider_agent_id",
        ownedAgentIds,
      ),
    ]);

    const privateJobs = mergeUnique(clientJobs, providerJobs, agentJobs);
    const allJobs = mergeUnique(publicRows.jobs, privateJobs);
    const clientJobIds = clientJobs.map((job) => job.id);
    const privateJobIds = privateJobs.map((job) => job.id);

    const [clientApplications, profileApplications, agentApplications] = await Promise.all([
      selectWhereIn(
        supabase
          .from(TABLES.applications)
          .select("*")
          .order("created_at", { ascending: false }),
        "job_id",
        clientJobIds,
      ),
      selectTable(
        supabase
          .from(TABLES.applications)
          .select("*")
          .eq("applicant_profile_id", session.profileId)
          .order("created_at", { ascending: false }),
      ),
      selectWhereIn(
        supabase
          .from(TABLES.applications)
          .select("*")
          .order("created_at", { ascending: false }),
        "applicant_agent_id",
        ownedAgentIds,
      ),
    ]);

    const userApplicationIds = mergeUnique(
      clientApplications,
      profileApplications,
      agentApplications,
    ).map((app) => app.id);

    const [
      submissions,
      reviews,
      aiEvaluations,
      privateTransactions,
      profileTransactions,
      notifications,
      jobMessages,
      jobInvitations,
      savedJobs,
      applicationOverlays,
    ] = await Promise.all([
        selectWhereIn(
          supabase
            .from(TABLES.submissions)
            .select("*")
            .order("created_at", { ascending: false }),
          "job_id",
          privateJobIds,
        ),
        selectWhereIn(
          supabase
            .from(TABLES.reviews)
            .select("*")
            .order("created_at", { ascending: false }),
          "job_id",
          privateJobIds,
        ),
        selectWhereIn(
          supabase
            .from(TABLES.aiEvaluations)
            .select("*")
            .order("created_at", { ascending: false }),
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
        selectTable(
          supabase
            .from(TABLES.transactions)
            .select("*")
            .eq("profile_id", session.profileId)
            .order("created_at", { ascending: false })
            .limit(100),
        ),
        selectTable(
          supabase
            .from(TABLES.notifications)
            .select("*")
            .eq("profile_id", session.profileId)
            .order("created_at", { ascending: false }),
        ),
        selectWhereIn(
          supabase
            .from(TABLES.jobMessages)
            .select("*")
            .order("created_at", { ascending: true }),
          "job_id",
          privateJobIds,
        ),
        selectTable(
          supabase
            .from(TABLES.jobInvitations)
            .select("*")
            .or(
              `to_worker_profile_id.eq.${session.profileId},from_client_profile_id.eq.${session.profileId}`,
            )
            .order("created_at", { ascending: false }),
        ),
        selectTable(
          supabase
            .from(TABLES.savedJobs)
            .select("*")
            .eq("profile_id", session.profileId)
            .order("created_at", { ascending: false }),
        ),
        selectWhereIn(
          supabase
            .from(TABLES.applicationOverlay)
            .select("*"),
          "application_id",
          userApplicationIds,
        ),
      ]);

    const rows: BootstrapRows = {
      profiles: publicRows.profiles,
      agents: mergeUnique(publicRows.agents, ownedAgents),
      jobs: allJobs,
      applications: mergeUnique(clientApplications, profileApplications, agentApplications),
      submissions,
      reviews,
      aiEvaluations,
      transactions: mergeUnique(publicRows.transactions, privateTransactions, profileTransactions),
      events: publicRows.events,
      notifications,
      jobMessages,
      jobInvitations,
      savedJobs,
      applicationOverlays,
    };

    return NextResponse.json({ state: toWorkNetState(rows, session?.profileId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load production data." },
      { status: 500 },
    );
  }
}
