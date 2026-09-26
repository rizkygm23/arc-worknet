import { NextResponse } from "next/server";
import {
  invalidPathParam,
  uuidParamSchema,
  getServiceClientOrResponse,
} from "@/lib/api";
import { extractAgentFromHeader } from "@/lib/server/agent-auth";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, props: RouteProps) {
  const parsedId = uuidParamSchema.safeParse((await props.params).id);
  if (!parsedId.success) return invalidPathParam();
  const id = parsedId.data;

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { data: agent, error } = await supabase
    .from(TABLES.agents)
    .select("id, name, slug, reputation_score, jobs_completed, arc_agent_id, identity_registry_address, reputation_registry_address")
    .eq("id", id)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  return NextResponse.json({ agent }, { status: 200 });
}

// POST rewrites the agent's derived reputation, so it must never be callable
// anonymously: only the owner (wallet session) or the agent itself (its own
// API key, as documented in the agent runbook) may trigger a recompute.
export async function POST(request: Request, props: RouteProps) {
  const parsedId = uuidParamSchema.safeParse((await props.params).id);
  if (!parsedId.success) return invalidPathParam();
  const id = parsedId.data;

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const agentAuth = await extractAgentFromHeader(request, supabase);
  const viaAgentKey = !agentAuth.error && agentAuth.agentId === id;

  let callerProfileId: string | undefined;
  if (viaAgentKey) {
    callerProfileId = undefined;
  } else {
    const { session, response: authResponse } = await requireWalletSession(supabase);
    if (authResponse) return authResponse;
    callerProfileId = session.profileId;
  }

  const limited = await walletRateLimit(request, callerProfileId ?? `agent-key:${id}`, "agents:reputation");
  if (limited) return limited;

  const { data: agent, error: agentError } = await supabase
    .from(TABLES.agents)
    .select("id,owner_profile_id")
    .eq("id", id)
    .maybeSingle();

  if (agentError) {
    return NextResponse.json({ error: "Database request failed." }, { status: 500 });
  }
  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }
  if (callerProfileId && agent.owner_profile_id !== callerProfileId) {
    return NextResponse.json(
      { error: "Only the agent owner can trigger a reputation recompute." },
      { status: 403 },
    );
  }

  // Compute completed jobs count for this agent
  const { data: jobs, error: jobsError } = await supabase
    .from(TABLES.jobs)
    .select("id, status")
    .eq("provider_agent_id", id)
    .eq("status", "completed");

  if (jobsError) {
    return NextResponse.json({ error: "Database request failed." }, { status: 500 });
  }

  const jobsCompleted = jobs ? jobs.length : 0;
  // Standard reputation score heuristic based on completion volume
  const reputationScore = Math.min(100, 50 + jobsCompleted * 10);

  const { data: updatedAgent, error: updateError } = await supabase
    .from(TABLES.agents)
    .update({
      jobs_completed: jobsCompleted,
      reputation_score: reputationScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Database request failed." }, { status: 500 });
  }

  void invalidateBootstrapCache();
  return NextResponse.json({ agent: updatedAgent }, { status: 200 });
}
