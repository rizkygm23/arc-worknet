import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { WALLET_SESSION_COOKIE, sha256 } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WALLET_SESSION_COOKIE)?.value;

  if (token) {
    const { supabase } = getServiceClientOrResponse();
    if (supabase) {
      await supabase
        .from(TABLES.walletSessions)
        .update({ revoked_at: new Date().toISOString() })
        .eq("token_hash", sha256(token))
        .is("revoked_at", null);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(WALLET_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
