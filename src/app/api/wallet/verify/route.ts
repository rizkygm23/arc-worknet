import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { z } from "zod";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import {
  createOpaqueToken,
  sessionExpiresAt,
  setWalletSessionCookie,
  sha256,
} from "@/lib/server/wallet-session";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { rateLimit } from "@/lib/server/rate-limit";
import { mapProfile } from "@/lib/supabase/mappers";
import { TABLES } from "@/lib/supabase/tables";

const verifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().int().positive(),
  nonce: z.string().min(16),
  message: z.string().min(20),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  timezone: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, verifySchema);
  if (!parsed.success) return validationError(parsed.error);
  const limited = await rateLimit(request, {
    key: `wallet-verify:${parsed.data.address.toLowerCase()}`,
    limit: 10,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const input = parsed.data;
  const address = input.address.toLowerCase();

  const { data: nonce, error: nonceError } = await supabase
    .from(TABLES.walletNonces)
    .select("*")
    .eq("nonce", input.nonce)
    .eq("wallet_address", address)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (nonceError || !nonce || nonce.message !== input.message) {
    return NextResponse.json({ error: "Wallet sign-in nonce is invalid or expired." }, { status: 401 });
  }

  if (input.chainId !== ARC_TESTNET_CHAIN_ID) {
    return NextResponse.json({ error: "Switch wallet to Arc Testnet before signing in." }, { status: 400 });
  }

  const isValid = await verifyMessage({
    address: input.address as `0x${string}`,
    message: input.message,
    signature: input.signature as `0x${string}`,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Wallet signature verification failed." }, { status: 401 });
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from(TABLES.profiles)
    .select("*")
    .eq("wallet_address", address)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  let profile = existingProfile;

  if (!profile) {
    const displayName = `Wallet ${input.address.slice(0, 6)}`;
    const handle = `wallet-${input.address.slice(2, 8).toLowerCase()}`;
    const initialRole = address.toLowerCase() === "0xe27f8bad54cdfc3f81fb47531e853c9517ce035b".toLowerCase() ? "admin" : "client";
    const { data: created, error: createError } = await supabase
      .from(TABLES.profiles)
      .insert({
        display_name: displayName,
        handle,
        wallet_address: address,
        timezone: input.timezone,
        bio: "Wallet-connected Arc WorkNet profile.",
        role: initialRole,
      })
      .select("*")
      .single();
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
    profile = created;
  } else {
    if (address.toLowerCase() === "0xe27f8bad54cdfc3f81fb47531e853c9517ce035b".toLowerCase() && profile.role !== "admin") {
      const { data: touched } = await supabase
        .from(TABLES.profiles)
        .update({ role: "admin", updated_at: new Date().toISOString() })
        .eq("id", profile.id)
        .select("*")
        .single();
      if (touched) profile = touched;
    } else if (input.timezone && existingProfile && existingProfile.timezone !== input.timezone) {
      const { data: touched } = await supabase
        .from(TABLES.profiles)
        .update({ timezone: input.timezone, updated_at: new Date().toISOString() })
        .eq("id", existingProfile.id)
        .select("*")
        .single();
      if (touched) profile = touched;
    }
  }

  await supabase
    .from(TABLES.walletNonces)
    .update({ used_at: new Date().toISOString() })
    .eq("id", nonce.id);

  const token = createOpaqueToken();
  const { error: sessionError } = await supabase.from(TABLES.walletSessions).insert({
    profile_id: profile.id,
    wallet_address: address,
    token_hash: sha256(token),
    expires_at: sessionExpiresAt(),
  });

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  await invalidateBootstrapCache();
  const json = NextResponse.json({ profile: mapProfile(profile) });
  setWalletSessionCookie(json, token);
  return json;
}
