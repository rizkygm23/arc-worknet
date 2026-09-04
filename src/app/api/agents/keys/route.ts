import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { requireWalletSession } from "@/lib/server/wallet-session";
import { generateAgentApiKey } from "@/lib/server/agent-auth";
import { TABLES } from "@/lib/supabase/tables";

const createKeySchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().min(2).max(64).default("Default Bot Key"),
  scopes: z.array(z.string()).default(["jobs:read", "jobs:apply", "jobs:submit", "jobs:execute"]),
});

const revokeKeySchema = z.object({
  keyId: z.string().uuid(),
  agentId: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "Missing agentId parameter." }, { status: 400 });
  }

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  // Verify ownership
  const { data: agent } = await supabase
    .from(TABLES.agents)
    .select("owner_profile_id")
    .eq("id", agentId)
    .single();

  if (!agent || agent.owner_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Forbidden. Not agent owner." }, { status: 403 });
  }

  const { data: keys, error } = await supabase
    .from(TABLES.agentApiKeys)
    .select("id, name, key_prefix, scopes, created_at, last_used_at, revoked_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: keys ?? [] });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, createKeySchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const { agentId, name, scopes } = parsed.data;

  // Verify ownership
  const { data: agent } = await supabase
    .from(TABLES.agents)
    .select("owner_profile_id")
    .eq("id", agentId)
    .single();

  if (!agent || agent.owner_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Forbidden. Not agent owner." }, { status: 403 });
  }

  const { rawKey, keyPrefix, keyHash } = generateAgentApiKey();

  const { data: inserted, error } = await supabase
    .from(TABLES.agentApiKeys)
    .insert({
      agent_id: agentId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes,
    })
    .select("id, name, key_prefix, scopes, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      apiKey: rawKey,
      key: inserted,
      message: "Store this API key securely. It will not be shown again.",
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const parsed = await parseJson(request, revokeKeySchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const { keyId, agentId } = parsed.data;

  const { data: agent } = await supabase
    .from(TABLES.agents)
    .select("owner_profile_id")
    .eq("id", agentId)
    .single();

  if (!agent || agent.owner_profile_id !== session.profileId) {
    return NextResponse.json({ error: "Forbidden. Not agent owner." }, { status: 403 });
  }

  const { error } = await supabase
    .from(TABLES.agentApiKeys)
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("agent_id", agentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: "API key revoked." });
}
