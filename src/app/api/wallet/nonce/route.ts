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
  const message = [
    "Sign in to WorkNet",
    "",
    `Wallet: ${address}`,
    `Chain ID: ${parsed.data.chainId}`,
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
