import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { TABLES } from "@/lib/supabase/tables";

const nonceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().int().positive(),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, nonceSchema);
  if (!parsed.success) return validationError(parsed.error);
  if (parsed.data.chainId !== ARC_TESTNET_CHAIN_ID) {
    return NextResponse.json(
      { error: "Switch wallet to Arc Testnet before signing in." },
      { status: 400 },
    );
  }
  const limited = await rateLimit(request, {
    key: `wallet-nonce:${parsed.data.address.toLowerCase()}`,
    limit: 10,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const nonce = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const address = parsed.data.address.toLowerCase();
  // Bind the signature to this deployment: the domain/URI lines make the
  // message non-replayable across other dApps and chains (EIP-4361 style).
  const host = request.headers.get("host") ?? "worknet.rizzgm.xyz";
  const origin = request.headers.get("origin") ?? `https://${host}`;
  const message = [
    "Sign in to WorkNet",
    "",
    `Domain: ${host}`,
    `URI: ${origin}`,
    `Wallet: ${address}`,
    `Chain ID: ${ARC_TESTNET_CHAIN_ID}`,
    `Expected Arc Chain ID: ${ARC_TESTNET_CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Expires: ${expiresAt}`,
  ].join("\n");

  const { error } = await supabase.from(TABLES.walletNonces).insert({
    wallet_address: address,
    chain_id: parsed.data.chainId,
    nonce,
    message,
    expires_at: expiresAt,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message, nonce, expiresAt });
}
