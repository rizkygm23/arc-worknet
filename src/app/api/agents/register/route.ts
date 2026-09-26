import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
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

import { createDeveloperControlledWallet, hasCircleWalletConfig } from "@/lib/server/circle-wallet";

const registerAgentSchema = z.object({
  ownerProfileId: z.string().uuid(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().min(10),
  capabilities: z.array(z.string().min(1).max(80)).default([]),
  agentWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  // Proof of control for client-supplied agent wallet addresses: signature by
  // the agent wallet over the deterministic challenge message below.
  walletSignature: z.string().regex(/^0x[a-fA-F0-9]+$/).optional(),
  walletSignatureTimestamp: z.string().datetime().optional(),
  metadataUri: z.string().min(3),
  arcAgentId: z.string().optional(),
  registrationTxHash: txHashSchema.optional(),
});

// Message the agent wallet must sign to prove control of a client-supplied
// address. Keep in sync with the agent onboarding docs.
function agentWalletChallengeMessage(agentWalletAddress: string, timestamp: string) {
  return [
    "Register agent wallet on WorkNet",
    "",
    `Address: ${agentWalletAddress}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");
}

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

  // A client-supplied agent wallet address needs proof of control so agents
  // cannot claim addresses they do not hold (identity spoofing, misdirected
  // payout expectations).
  if (input.agentWalletAddress) {
    const timestamp = input.walletSignatureTimestamp;
    const timestampMs = timestamp ? Date.parse(timestamp) : Number.NaN;
    const challenge =
      timestamp && Number.isFinite(timestampMs) && Math.abs(Date.now() - timestampMs) <= 10 * 60 * 1000
        ? agentWalletChallengeMessage(input.agentWalletAddress, timestamp)
        : undefined;

    if (!challenge || !input.walletSignature) {
      return NextResponse.json(
        {
          error:
            "Agent wallet ownership proof is required: sign the registration challenge with the agent wallet within 10 minutes.",
        },
        { status: 400 },
      );
    }

    const proofValid = await verifyMessage({
      address: input.agentWalletAddress as `0x${string}`,
      message: challenge,
      signature: input.walletSignature as `0x${string}`,
    });
    if (!proofValid) {
      return NextResponse.json(
        { error: "Agent wallet signature does not prove ownership of the address." },
        { status: 403 },
      );
    }
  }

  const circleWallet = !input.agentWalletAddress && hasCircleWalletConfig()
    ? await createDeveloperControlledWallet()
    : undefined;
  const agentWalletAddress = input.agentWalletAddress ?? circleWallet?.address;
  if (!agentWalletAddress) {
    return NextResponse.json(
      { error: "Provide agent wallet address or configure Circle developer wallet env." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from(TABLES.agents)
    .insert({
      owner_profile_id: session.profileId,
      name: input.name,
      slug,
      description: input.description,
      capabilities: input.capabilities,
      agent_wallet_address: agentWalletAddress,
      circle_wallet_id: circleWallet?.walletId,
      circle_wallet_set_id: circleWallet?.walletSetId,
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
  void invalidateBootstrapCache();
  return NextResponse.json({ agent: data }, { status: 201 });
}
