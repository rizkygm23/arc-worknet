import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

export async function GET(_request: Request) {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const { data, error } = await supabase
    .from(TABLES.jobInvitations)
    .select("*")
    .or(
      `to_worker_profile_id.eq.${session.profileId},from_client_profile_id.eq.${session.profileId}`,
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invitations: data ?? [] });
}
