import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { readArcUsdcBalance } from "@/lib/wallet";
import { getServiceClientOrResponse } from "@/lib/api";
import { walletRateLimit } from "@/lib/server/rate-limit";
import { requireWalletSession } from "@/lib/server/wallet-session";

// Server-side USDC balance proxy. The browser cannot read the Arc RPC
// directly (bot protection blocks cross-origin browser fetches), so the
// client calls this route instead — the server round-trip is unaffected.
export async function POST(request: Request) {
  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  const { session, response: authResponse } = await requireWalletSession(supabase);
  if (authResponse) return authResponse;

  const limited = await walletRateLimit(request, session.walletAddress, "wallet:balance");
  if (limited) return limited;

  try {
    const body = (await request.json().catch(() => ({}))) as { address?: string };
    // A session may only read its own wallet's balance.
    const target = body.address ? getAddress(body.address) : getAddress(session.walletAddress);
    if (target.toLowerCase() !== session.walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "Address does not match session." }, { status: 403 });
    }

    const balance = await readArcUsdcBalance(target);
    return NextResponse.json({ balance: balance.toString() }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Balance fetch failed." },
      { status: 502 },
    );
  }
}
