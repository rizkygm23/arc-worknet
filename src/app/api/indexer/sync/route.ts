import { NextResponse } from "next/server";
import { getServiceClientOrResponse, requireAdminSecret } from "@/lib/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { runArcEventSync } from "@/lib/server/arc-indexer";

export async function POST(request: Request) {
  const secretResponse = requireAdminSecret(request);
  if (secretResponse) return secretResponse;

  const limited = await rateLimit(request, {
    key: "indexer:sync",
    limit: 60,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  try {
    const summary = await runArcEventSync(supabase);
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed." },
      { status: 500 },
    );
  }
}
