import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { getWalletSession } from "@/lib/server/wallet-session";

export const dynamic = "force-dynamic";

const getCachedPublicStatistics = unstable_cache(
  async () => {
    const { supabase, response } = getServiceClientOrResponse();
    if (response || !supabase) throw new Error("Statistics service is unavailable.");

    const [rpcRes, spentRes, jobsRes, clientsRes, completedRes] = await Promise.all([
      supabase.rpc("get_public_statistics_arcworker"),
      supabase.from("profiles_arcworker").select("total_spent_usdc_units"),
      supabase.from("jobs_arcworker").select("budget_usdc_units").not("status", "in", '("draft","open")'),
      supabase.from("profiles_arcworker").select("id", { count: "exact", head: true }).eq("role", "client").not("is_blocked", "is", true),
      supabase.from("jobs_arcworker").select("id", { count: "exact", head: true }).eq("status", "completed"),
    ]);

    if (rpcRes.error) throw new Error(rpcRes.error.message);

    const publicStats = rpcRes.data as Record<string, unknown>;
    const totalSpent = spentRes.data?.reduce((sum, p) => sum + (p.total_spent_usdc_units || 0), 0) ?? 0;
    const jobsVolume = jobsRes.data?.reduce((sum, j) => sum + (j.budget_usdc_units || 0), 0) ?? 0;
    const totalVolumeUsdcUnits = Math.max(totalSpent, jobsVolume);

    return {
      ...publicStats,
      clients: clientsRes.count ?? 0,
      completedJobs: completedRes.count ?? 0,
      totalVolumeUsdcUnits,
    };
  },
  ["public-statistics-arcworker"],
  { revalidate: 15 },
);

export async function GET() {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  try {
    const session = await getWalletSession(supabase);
    const [publicStatistics, privateResult] = await Promise.all([
      getCachedPublicStatistics(),
      session
        ? supabase.rpc("get_private_statistics_arcworker", { p_profile_id: session.profileId })
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (privateResult.error) throw new Error(privateResult.error.message);

    return NextResponse.json(
      { public: publicStatistics, private: privateResult.data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load statistics." },
      { status: 500 },
    );
  }
}
