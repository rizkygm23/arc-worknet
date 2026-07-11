import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const patchSchema = z.object({
  status: z.enum(["accepted", "declined"]),
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
  const limited = await walletRateLimit(request, session.profileId, "jobs:invite-respond");
  if (limited) return limited;

  const { data: invitation, error: loadError } = await supabase
    .from(TABLES.jobInvitations)
    .select("id,to_worker_profile_id,status")
    .eq("id", id)
    .maybeSingle();
  if (loadError || !invitation) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }
  if (invitation.to_worker_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "Invitation already resolved." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from(TABLES.jobInvitations)
    .update({ status: parsed.data.status, responded_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  void invalidateBootstrapCache();
  return NextResponse.json({ invitation: data });
}
