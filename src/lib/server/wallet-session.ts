import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { createSupabaseServiceClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";

export const WALLET_SESSION_COOKIE = "arc_worknet_wallet_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type SupabaseServiceClient = ReturnType<typeof createSupabaseServiceClient>;

export type WalletSession = {
  profileId: string;
  walletAddress: string;
};

export function createOpaqueToken() {
  return randomBytes(32).toString("hex");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
}

// In-memory session cache. Keyed by token_hash, auto-expires after TTL.
// Revoked sessions are picked up within CACHE_TTL_MS (acceptable staleness).
const SESSION_CACHE_TTL_MS = 30_000;
type CachedSession = { session: WalletSession; expiresAt: number };
const sessionCache = new Map<string, CachedSession>();

export async function getWalletSession(supabase: SupabaseServiceClient): Promise<WalletSession | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(WALLET_SESSION_COOKIE)?.value;
  if (!token) return undefined;

  const tokenHash = sha256(token);

  // Check in-memory cache first
  const cached = sessionCache.get(tokenHash);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.session;
  }

  const { data, error } = await supabase
    .from(TABLES.walletSessions)
    .select("profile_id,wallet_address")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    sessionCache.delete(tokenHash);
    return undefined;
  }

  const session: WalletSession = {
    profileId: data.profile_id,
    walletAddress: data.wallet_address,
  };
  sessionCache.set(tokenHash, { session, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
  return session;
}

export async function requireWalletSession(supabase: SupabaseServiceClient) {
  const session = await getWalletSession(supabase);
  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Connect and sign your wallet before using this production endpoint." },
        { status: 401 },
      ),
    };
  }

  return { session };
}

export function setWalletSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(WALLET_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}
