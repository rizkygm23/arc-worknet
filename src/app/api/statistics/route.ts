import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getServiceClientOrResponse } from "@/lib/api";
import { getWalletSession } from "@/lib/server/wallet-session";

export const dynamic = "force-dynamic";

const getCachedPublicStatistics = unstable_cache(
  async () => {
    const { supabase, response } = getServiceClientOrResponse();
    if (response || !supabase) throw new Error("Statistics service is unavailable.");

    const { data, error } = await supabase.rpc("get_public_statistics_arcworker");
    if (error) throw new Error(error.message);
    return data;
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
