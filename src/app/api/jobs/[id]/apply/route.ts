import { NextResponse } from "next/server";
import { applySchema, getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, applySchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:apply");
  if (limited) return limited;

  const input = parsed.data;
  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id,status")
    .eq("id", id)
    .single();

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 404 });
  if (job.status !== "open") {
    return NextResponse.json({ error: "Applications are only open while the job is open." }, { status: 400 });
  }
  if (job.client_profile_id === session.profileId) {
    return NextResponse.json({ error: "Client wallet cannot apply to its own job." }, { status: 403 });
  }

  if (input.actorType === "human" && input.applicantProfileId && input.applicantProfileId !== session.profileId) {
    return NextResponse.json({ error: "Applicant profile does not match connected wallet." }, { status: 403 });
  }

  if (input.actorType === "agent") {
    if (!input.applicantAgentId) {
      return NextResponse.json({ error: "Agent application requires applicantAgentId." }, { status: 400 });
    }

    const { data: agent, error: agentError } = await supabase
      .from(TABLES.agents)
      .select("owner_profile_id")
      .eq("id", input.applicantAgentId)
      .single();

    if (agentError) return NextResponse.json({ error: agentError.message }, { status: 404 });
    if (agent.owner_profile_id !== session.profileId) {
      return NextResponse.json({ error: "Connected wallet does not own this agent." }, { status: 403 });
    }
  }

  const applicantProfileId = input.actorType === "human" ? session.profileId : null;

  if (input.actorType === "human") {
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
      void invalidateBootstrapCache();
      return NextResponse.json({ application: data }, { status: 200 });
    }
  }

  const { data, error } = await supabase
    .from(TABLES.applications)
    .insert({
      job_id: id,
      applicant_profile_id: applicantProfileId,
      applicant_agent_id: input.applicantAgentId,
      actor_type: input.actorType,
      pitch: input.pitch,
      proposed_budget_usdc_units: input.proposedBudgetUsdcUnits,
      proposed_deadline_at: input.proposedDeadlineAt,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  void invalidateBootstrapCache();
  return NextResponse.json({ application: data }, { status: 201 });
}
