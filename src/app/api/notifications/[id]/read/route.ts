import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "notifications:read");
  if (limited) return limited;

  const { data: notification, error: loadError } = await supabase
    .from(TABLES.notifications)
    .select("id,profile_id,read_at")
    .eq("id", id)
    .maybeSingle();
  if (loadError || !notification) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }
  if (notification.profile_id !== session.profileId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (notification.read_at) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from(TABLES.notifications)
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await invalidateBootstrapCache();
  return NextResponse.json({ ok: true });
}
