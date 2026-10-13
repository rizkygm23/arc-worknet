import { NextResponse } from "next/server";
import { TABLES } from "@/lib/supabase/tables";
import { applySchema, getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { extractAgentFromHeader } from "@/lib/server/agent-auth";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession, type WalletSession } from "@/lib/server/wallet-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, applySchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const input = parsed.data;

  // Two auth paths: a wallet session (human owner) or the agent's own API key.
  // Agent keys let autonomous agents apply without a browser sign-in flow.
  const agentAuth = await extractAgentFromHeader(request, supabase);
  const keyAgentId = agentAuth.agentId;
  const viaAgentKey = !agentAuth.error && typeof keyAgentId === "string";

  let session: WalletSession | undefined;
  if (!viaAgentKey) {
    const { session: walletSession, response: authResponse } = await requireWalletSession(supabase);
    if (authResponse) return authResponse;
    session = walletSession;
  }

  const limited = await walletRateLimit(
    request,
    session?.profileId ?? keyAgentId ?? "agent-key",
    "jobs:apply",
  );
  if (limited) return limited;

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id,status")
    .eq("id", id)
    .single();

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 404 });
  if (job.status !== "open") {
    return NextResponse.json({ error: "Applications are only open while the job is open." }, { status: 400 });
  }
  if (session && job.client_profile_id === session.profileId) {
    return NextResponse.json({ error: "Client wallet cannot apply to its own job." }, { status: 403 });
  }

  if (viaAgentKey && input.actorType !== "agent") {
    return NextResponse.json(
      { error: "Agent API keys can only apply with actorType 'agent'." },
      { status: 400 },
    );
  }

  if (input.actorType === "human" && input.applicantProfileId && session && input.applicantProfileId !== session.profileId) {
    return NextResponse.json({ error: "Applicant profile does not match connected wallet." }, { status: 403 });
  }

  let applicantAgentId: string | null = null;
  if (input.actorType === "agent") {
    if (viaAgentKey) {
      // The agent key already proves ownership of its agent.
      if (input.applicantAgentId && input.applicantAgentId !== keyAgentId) {
        return NextResponse.json({ error: "API key does not belong to this agent." }, { status: 403 });
      }
      applicantAgentId = keyAgentId;
    } else {
      if (!input.applicantAgentId) {
        return NextResponse.json({ error: "Agent application requires applicantAgentId." }, { status: 400 });
      }
      // A wallet session must prove agent ownership against the agents table.
      const { data: agent, error: agentError } = await supabase
        .from(TABLES.agents)
        .select("owner_profile_id")
        .eq("id", input.applicantAgentId)
        .single();

      if (agentError) return NextResponse.json({ error: agentError.message }, { status: 404 });
      if (session && agent.owner_profile_id !== session.profileId) {
        return NextResponse.json({ error: "Connected wallet does not own this agent." }, { status: 403 });
      }
      applicantAgentId = input.applicantAgentId;
    }
  }

  const applicantProfileId = input.actorType === "human" && session ? session.profileId : null;

  if (input.actorType === "human" && session) {
    const { data: existingApplication, error: existingError } = await supabase
      .from(TABLES.applications)
      .select("*")
      .eq("job_id", id)
      .eq("applicant_profile_id", session.profileId)
      .maybeSingle();

    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

    if (existingApplication) {
      const { data, error } = await supabase
        .from(TABLES.applications)
        .update({
          pitch: input.pitch,
          proposed_budget_usdc_units: input.proposedBudgetUsdcUnits,
          proposed_deadline_at: input.proposedDeadlineAt,
          status: existingApplication.status === "withdrawn" ? "pending" : existingApplication.status,
        })
        .eq("id", existingApplication.id)
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      void invalidateBootstrapCache(id);
      return NextResponse.json({ application: data }, { status: 200 });
    }
  }

  const { data, error } = await supabase
    .from(TABLES.applications)
    .insert({
      job_id: id,
      applicant_profile_id: applicantProfileId,
      applicant_agent_id: applicantAgentId,
      actor_type: input.actorType,
      pitch: input.pitch,
      proposed_budget_usdc_units: input.proposedBudgetUsdcUnits,
      proposed_deadline_at: input.proposedDeadlineAt,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  void invalidateBootstrapCache(id);
  return NextResponse.json({ application: data }, { status: 201 });
}
