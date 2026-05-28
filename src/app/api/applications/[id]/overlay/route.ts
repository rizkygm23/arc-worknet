import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const patchSchema = z.object({
  status: z.enum(["withdrawn", "rejected"]),
  reason: z.string().trim().max(2000).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const parsed = await parseJson(request, patchSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "applications:overlay");
  if (limited) return limited;

  const { data: application, error: loadError } = await supabase
    .from(TABLES.applications)
    .select("id,job_id,applicant_profile_id")
    .eq("id", id)
    .maybeSingle();
  if (loadError || !application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const { data: job, error: jobError } = await supabase
    .from(TABLES.jobs)
    .select("client_profile_id")
    .eq("id", application.job_id)
    .maybeSingle();
  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (parsed.data.status === "withdrawn") {
    if (application.applicant_profile_id !== session.profileId) {
      return NextResponse.json({ error: "Only the applicant can withdraw." }, { status: 403 });
    }
  } else {
    if (job.client_profile_id !== session.profileId) {
      return NextResponse.json({ error: "Only the job owner can reject." }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from(TABLES.applicationOverlay)
    .upsert(
      {
        application_id: id,
        status: parsed.data.status,
        reason: parsed.data.reason ?? null,
        actor_profile_id: session.profileId,
      },
      { onConflict: "application_id" },
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await invalidateBootstrapCache();
  return NextResponse.json({ overlay: data });
}
