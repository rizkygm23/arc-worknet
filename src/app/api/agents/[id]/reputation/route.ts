import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { TABLES } from "@/lib/supabase/tables";
import { invalidateBootstrapCache } from "@/lib/server/cache";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const { id } = params;

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

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const { id } = params;

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  // Compute completed jobs count for this agent
  const { data: jobs, error: jobsError } = await supabase
    .from(TABLES.jobs)
    .select("id, status")
    .eq("provider_agent_id", id)
    .eq("status", "completed");

  if (jobsError) {
    return NextResponse.json({ error: jobsError.message }, { status: 500 });
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
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  void invalidateBootstrapCache();
  return NextResponse.json({ agent: updatedAgent }, { status: 200 });
}
