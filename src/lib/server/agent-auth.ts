import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/lib/supabase/tables";

export interface AgentApiKeyRecord {
  id: string;
  agent_id: string;
  key_prefix: string;
  key_hash: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at?: string;
  revoked_at?: string;
}

export function generateAgentApiKey() {
  const secret = crypto.randomBytes(24).toString("hex");
  const rawKey = `wk_agent_${secret}`;
  const keyPrefix = rawKey.slice(0, 14); // e.g. wk_agent_ab12
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  return { rawKey, keyPrefix, keyHash };
}

export function hashAgentApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export async function verifyAgentApiKey(
  supabase: SupabaseClient,
  rawKey: string,
): Promise<{ valid: boolean; agentId?: string; scopes?: string[]; error?: string }> {
  if (!rawKey.startsWith("wk_agent_")) {
    return { valid: false, error: "Invalid agent key format." };
  }

  const keyHash = hashAgentApiKey(rawKey);

  const { data: keyRecord, error } = await supabase
    .from(TABLES.agentApiKeys)
    .select("id, agent_id, scopes, revoked_at")
    .eq("key_hash", keyHash)
    .single();

  if (error || !keyRecord) {
    return { valid: false, error: "Agent API key not found or inactive." };
  }

  if (keyRecord.revoked_at) {
    return { valid: false, error: "Agent API key has been revoked." };
  }

  // Update last_used_at asynchronously (no blocking)
  void supabase
    .from(TABLES.agentApiKeys)
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  return {
    valid: true,
    agentId: keyRecord.agent_id,
    scopes: keyRecord.scopes ?? ["jobs:read", "jobs:apply", "jobs:submit"],
  };
}

export async function extractAgentFromHeader(
  request: Request,
  supabase: SupabaseClient,
): Promise<{ agentId?: string; scopes?: string[]; error?: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer wk_agent_")) {
    return { error: "Missing or invalid Bearer agent key." };
  }

  const token = authHeader.replace(/^Bearer\s+/, "").trim();
  const res = await verifyAgentApiKey(supabase, token);
  if (!res.valid) {
    return { error: res.error };
  }

  return { agentId: res.agentId, scopes: res.scopes };
}
