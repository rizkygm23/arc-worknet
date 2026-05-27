import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ERC8004_IDENTITY_REGISTRY,
  ERC8004_REPUTATION_REGISTRY,
  ERC8004_VALIDATION_REGISTRY,
} from "@/lib/arc";
import { getServiceClientOrResponse, parseJson, txHashSchema, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

const registerAgentSchema = z.object({
  ownerProfileId: z.string().uuid(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().min(10),
  capabilities: z.array(z.string().min(1).max(80)).default([]),
  agentWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  metadataUri: z.string().min(3),
  arcAgentId: z.string().optional(),
  registrationTxHash: txHashSchema.optional(),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, registerAgentSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;
  const limited = await walletRateLimit(request, session.profileId, "agents:register");
  if (limited) return limited;

  const input = parsed.data;
  if (input.ownerProfileId !== session.profileId) {
    return NextResponse.json({ error: "Owner profile does not match connected wallet." }, { status: 403 });
  }

  const slug =
    input.slug ??
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from(TABLES.agents)
    .insert({
      owner_profile_id: session.profileId,
      name: input.name,
      slug,
      description: input.description,
      capabilities: input.capabilities,
      agent_wallet_address: input.agentWalletAddress,
      metadata_uri: input.metadataUri,
      arc_agent_id: input.arcAgentId,
      identity_registry_address: ERC8004_IDENTITY_REGISTRY,
      reputation_registry_address: ERC8004_REPUTATION_REGISTRY,
      validation_registry_address: ERC8004_VALIDATION_REGISTRY,
      registration_tx_hash: input.registrationTxHash,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await invalidateBootstrapCache();
  return NextResponse.json({ agent: data }, { status: 201 });
}
