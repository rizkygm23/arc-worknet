import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
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
  "disputed",
] as const;

const PUBLIC_LIST_LIMIT = 200;

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

export async function GET() {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  try {
    const [profiles, agents, jobs, events] = await Promise.all([
      selectTable(
        supabase
          .from(TABLES.profiles)
          .select("*")
          .eq("is_blocked", false)
          .order("created_at", { ascending: false })
          .limit(PUBLIC_LIST_LIMIT),
      ),
      selectTable(
        supabase
          .from(TABLES.agents)
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(PUBLIC_LIST_LIMIT),
      ),
      selectTable(
        supabase
          .from(TABLES.jobs)
          .select("*")
          .in("status", [...PUBLIC_JOB_STATUSES])
          .order("created_at", { ascending: false })
          .limit(PUBLIC_LIST_LIMIT),
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

    const rows: BootstrapRows = {
      profiles,
      agents,
      jobs,
      transactions,
      events,
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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load production data." },
      { status: 500 },
    );
  }
}
