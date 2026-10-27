import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession, type WalletSession } from "@/lib/server/wallet-session";
import { TABLES } from "@/lib/supabase/tables";

type SupabaseServiceClient = NonNullable<Awaited<ReturnType<typeof getServiceClientOrResponse>>["supabase"]>;

const createSkillSchema = z.object({
  name: z.string().trim().min(1).max(48),
  category: z.string().trim().min(1).max(48),
});

const updateSkillSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(48).optional(),
  category: z.string().trim().min(1).max(48).optional(),
});

const deleteSkillSchema = z.object({
  id: z.string().uuid(),
});

// Skills master data is admin-managed: requires a wallet session whose profile role is admin.
async function requireAdminSession(
  supabase: SupabaseServiceClient,
): Promise<{ session?: WalletSession; response?: NextResponse }> {
  const { session, response } = await requireWalletSession(supabase);
  if (response) return { response };

  const { data: profile, error } = await supabase
    .from(TABLES.profiles)
    .select("role")
    .eq("id", session.profileId)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }

  return { session };
}

export async function GET() {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { data, error } = await supabase
    .from(TABLES.skills)
    .select("id,name,category,created_at")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ skills: data }, { status: 200 });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, createSkillSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response: serviceResponse } = getServiceClientOrResponse();
  if (serviceResponse) return serviceResponse;
  const { session, response: adminResponse } = await requireAdminSession(supabase);
  if (adminResponse) return adminResponse;

  const limited = await walletRateLimit(request, session!.profileId, "skills:write");
  if (limited) return limited;

  const { data, error } = await supabase
    .from(TABLES.skills)
    .upsert(
      { name: parsed.data.name.toLowerCase(), category: parsed.data.category.toLowerCase() },
      { onConflict: "name" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void invalidateBootstrapCache();
  return NextResponse.json({ skill: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const parsed = await parseJson(request, updateSkillSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { id, name, category } = parsed.data;
  if (!name && !category) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { supabase, response: serviceResponse } = getServiceClientOrResponse();
  if (serviceResponse) return serviceResponse;
  const { session, response: adminResponse } = await requireAdminSession(supabase);
  if (adminResponse) return adminResponse;

  const limited = await walletRateLimit(request, session!.profileId, "skills:write");
  if (limited) return limited;

  const patch: Record<string, string> = {};
  if (name) patch.name = name.toLowerCase();
  if (category) patch.category = category.toLowerCase();

  const { data, error } = await supabase
    .from(TABLES.skills)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void invalidateBootstrapCache();
  return NextResponse.json({ skill: data }, { status: 200 });
}

export async function DELETE(request: Request) {
  const parsed = await parseJson(request, deleteSkillSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response: serviceResponse } = getServiceClientOrResponse();
  if (serviceResponse) return serviceResponse;
  const { session, response: adminResponse } = await requireAdminSession(supabase);
  if (adminResponse) return adminResponse;

  const limited = await walletRateLimit(request, session!.profileId, "skills:write");
  if (limited) return limited;

  const { error } = await supabase
    .from(TABLES.skills)
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void invalidateBootstrapCache();
  return NextResponse.json({ ok: true }, { status: 200 });
}
