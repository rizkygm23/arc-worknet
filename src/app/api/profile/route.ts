import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClientOrResponse, parseJson, validationError } from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";
import type { Database } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";

type ProfileUpdate = Database["public"]["Tables"]["profiles_arcworker"]["Update"];

const portfolioItemSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(160),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional(),
});

const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(120).optional(),
    handle: z
      .string()
      .trim()
      .min(3)
      .max(48)
      .regex(/^[a-zA-Z0-9_-]+$/, "Handle may only contain letters, numbers, dashes, underscores.")
      .optional(),
    role: z.enum(["client", "worker", "agent_owner"]).optional(),
    bio: z.string().trim().max(2000).optional(),
    avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
    countryCode: z.string().trim().max(8).optional(),
    timezone: z.string().trim().max(64).optional(),
    skills: z.array(z.string().trim().min(1).max(48)).max(40).optional(),
    hourlyRateUsdcUnits: z
      .number()
      .int()
      .min(0)
      .max(10_000_000_000)
      .nullable()
      .optional(),
    availability: z.enum(["open", "limited", "unavailable"]).nullable().optional(),
    portfolio: z.array(portfolioItemSchema).max(20).optional(),
  })
  .strict();

export async function PATCH(request: Request) {
  const parsed = await parseJson(request, updateProfileSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;
  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const limited = await walletRateLimit(request, session.profileId, "profile:update");
  if (limited) return limited;

  const input = parsed.data;
  if (Object.keys(input).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // Handle must be unique across profiles.
  if (input.handle) {
    const { data: existing } = await supabase
      .from(TABLES.profiles)
      .select("id")
      .eq("handle", input.handle)
      .neq("id", session.profileId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Handle is already taken.", details: { fieldErrors: { handle: ["Already taken."] } } },
        { status: 409 },
      );
    }
  }

  const patch: ProfileUpdate = { updated_at: new Date().toISOString() };
  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.handle !== undefined) patch.handle = input.handle;
  if (input.role !== undefined) patch.role = input.role;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl || null;
  if (input.countryCode !== undefined) patch.country_code = input.countryCode || null;
  if (input.timezone !== undefined) patch.timezone = input.timezone || null;
  if (input.skills !== undefined) patch.skills = input.skills;
  if (input.hourlyRateUsdcUnits !== undefined) patch.hourly_rate_usdc_units = input.hourlyRateUsdcUnits;
  if (input.availability !== undefined) patch.availability = input.availability;
  if (input.portfolio !== undefined) patch.portfolio = input.portfolio;

  const { data, error } = await supabase
    .from(TABLES.profiles)
    .update(patch)
    .eq("id", session.profileId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidateBootstrapCache();
  return NextResponse.json({ profile: data }, { status: 200 });
}
