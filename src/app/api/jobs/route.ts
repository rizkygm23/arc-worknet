import { NextResponse } from "next/server";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import {
  createJobSchema,
  getServiceClientOrResponse,
  parseJson,
  validationError,
} from "@/lib/api";
import { env } from "@/lib/env";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";
import { mapAgent, mapJob, mapProfile } from "@/lib/supabase/mappers";
import type { JobStatus } from "@/lib/types";

const PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;
const jobStatuses = new Set<JobStatus>([
  "open", "assigned", "onchain_created", "budget_set", "funded", "submitted",
  "revision_requested", "completed", "rejected", "disputed", "cancelled",
]);

function decodeCursor(value: string | null): { createdAt: string; id: string } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      createdAt?: unknown;
      id?: unknown;
    };
    if (
      typeof parsed.createdAt !== "string" ||
      Number.isNaN(Date.parse(parsed.createdAt)) ||
      typeof parsed.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(parsed.id)
    ) return null;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const params = new URL(request.url).searchParams;
  const requestedLimit = Number.parseInt(params.get("limit") ?? String(PAGE_SIZE), 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, requestedLimit))
    : PAGE_SIZE;
  const rawCursor = params.get("cursor");
  const cursor = decodeCursor(rawCursor);
  if (rawCursor && !cursor) {
    return NextResponse.json({ error: "Invalid cursor." }, { status: 400 });
  }

  let query = supabase
    .from(TABLES.jobs)
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  const status = params.get("status");
  if (status && status !== "all") {
    if (!jobStatuses.has(status as JobStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    query = query.eq("status", status as JobStatus);
  }
  const actorType = params.get("actorType");
  if (actorType && actorType !== "all") {
    if (actorType !== "human" && actorType !== "agent") {
      return NextResponse.json({ error: "Invalid actor type." }, { status: 400 });
    }
    query = query.eq("actor_type", actorType);
  }
  const category = params.get("category");
  if (category && category !== "all") query = query.eq("category", category.slice(0, 80));
  const search = params.get("q")?.trim();
  if (search) query = query.ilike("title", `%${search.slice(0, 100)}%`);
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data ?? [];
  const pageRows = rows.slice(0, limit);
  const profileIds = Array.from(new Set(pageRows.flatMap((row) => [row.client_profile_id, row.provider_profile_id]).filter(Boolean))) as string[];
  const agentIds = Array.from(new Set(pageRows.map((row) => row.provider_agent_id).filter(Boolean))) as string[];
  const [profilesResult, agentsResult] = await Promise.all([
    profileIds.length ? supabase.from(TABLES.profiles).select("*").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
    agentIds.length ? supabase.from(TABLES.agents).select("*").in("id", agentIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (profilesResult.error) return NextResponse.json({ error: profilesResult.error.message }, { status: 500 });
  if (agentsResult.error) return NextResponse.json({ error: agentsResult.error.message }, { status: 500 });
  const last = pageRows.at(-1);
  const nextCursor = rows.length > limit && last
    ? Buffer.from(JSON.stringify({ createdAt: last.created_at, id: last.id })).toString("base64url")
    : null;

  return NextResponse.json({
    items: pageRows.map(mapJob),
    profiles: (profilesResult.data ?? []).map(mapProfile),
    agents: (agentsResult.data ?? []).map(mapAgent),
    nextCursor,
    hasMore: nextCursor !== null,
  });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, createJobSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:create");
  if (limited) return limited;

  const input = parsed.data;
  if (input.clientProfileId !== session.profileId) {
    return NextResponse.json({ error: "Client profile does not match connected wallet." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from(TABLES.jobs)
    .insert({
      client_profile_id: session.profileId,
      actor_type: input.actorType,
      title: input.title,
      brief: input.brief,
      acceptance_criteria: input.acceptanceCriteria,
      deliverable_format: input.deliverableFormat,
      category: input.category,
      tags: input.tags,
      budget_usdc_units: input.budgetUsdcUnits,
      platform_fee_bps: env.PLATFORM_FEE_BPS,
      deadline_at: input.deadlineAt,
      status: "open",
      arc_chain_id: ARC_TESTNET_CHAIN_ID,
      evaluator_address: session.walletAddress,
      description_hash: input.descriptionHash,
      task_file_path: input.taskFilePath,
      task_file_name: input.taskFileName,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  void invalidateBootstrapCache(data.id);
  return NextResponse.json({ job: data }, { status: 201 });
}
