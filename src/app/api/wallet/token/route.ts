import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { requireWalletSession, createOpaqueToken, sha256, sessionExpiresAt } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

export async function POST() {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const token = createOpaqueToken();
  const tokenHash = sha256(token);

  const { error } = await supabase
    .from(TABLES.walletSessions)
    .insert({
      profile_id: session.profileId,
      wallet_address: session.walletAddress,
      token_hash: tokenHash,
      expires_at: sessionExpiresAt(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token }, { status: 200 });
}
