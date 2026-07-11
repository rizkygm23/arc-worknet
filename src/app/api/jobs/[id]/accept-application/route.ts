import { NextResponse } from "next/server";
import { TABLES } from "@/lib/supabase/tables";
import {
  acceptApplicationSchema,
  getServiceClientOrResponse,
  parseJson,
  validationError,
} from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, acceptApplicationSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "jobs:accept-application");
  if (limited) return limited;

  const { data: targetJob, error: targetJobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id,status")
    .eq("id", id)
    .single();

  if (targetJobError) return NextResponse.json({ error: targetJobError.message }, { status: 404 });
  if (targetJob.client_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Only the connected client wallet can accept applications." }, { status: 403 });
  }
  if (targetJob.status !== "open") {
    return NextResponse.json({ error: "Applications can only be accepted while the job is open." }, { status: 400 });
  }

  const { data: application, error: applicationError } = await supabase
    .from(TABLES.applications)
    .select("*")
    .eq("id", parsed.data.applicationId)
    .eq("job_id", id)
    .eq("status", "pending")
    .single();

  if (applicationError) {
    return NextResponse.json({ error: applicationError.message }, { status: 404 });
  }

  const { data: profile } = application.applicant_profile_id
    ? await supabase
        .from(TABLES.profiles)
        .select("wallet_address")
        .eq("id", application.applicant_profile_id)
        .single()
    : { data: null };

  const { data: agent } = application.applicant_agent_id
    ? await supabase
        .from(TABLES.agents)
        .select("agent_wallet_address")
        .eq("id", application.applicant_agent_id)
        .single()
    : { data: null };

  const providerAddress = profile?.wallet_address ?? agent?.agent_wallet_address ?? null;
  if (!providerAddress) {
    return NextResponse.json({ error: "Accepted provider must have a wallet address." }, { status: 400 });
  }

  const { error: acceptError } = await supabase
    .from(TABLES.applications)
    .update({ status: "accepted" })
    .eq("id", parsed.data.applicationId);

  if (acceptError) return NextResponse.json({ error: acceptError.message }, { status: 500 });

  await supabase
    .from(TABLES.applications)
    .update({ status: "rejected" })
    .eq("job_id", id)
    .eq("status", "pending");

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .update({
      provider_profile_id: application.applicant_profile_id,
      provider_agent_id: application.applicant_agent_id,
      actor_type: application.actor_type,
      provider_address: providerAddress,
      status: "assigned",
    })
    .eq("id", id)
    .select("*")
    .single();

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 });
  void invalidateBootstrapCache();
  return NextResponse.json({ job });
}
