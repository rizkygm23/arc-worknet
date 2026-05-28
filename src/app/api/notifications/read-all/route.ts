import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

export async function POST(request: Request) {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "notifications:read-all");
  if (limited) return limited;

  const { error } = await supabase
    .from(TABLES.notifications)
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", session.profileId)
    .is("read_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await invalidateBootstrapCache();
  return NextResponse.json({ ok: true });
}
