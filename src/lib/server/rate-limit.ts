import { NextResponse } from "next/server";
import { hasSupabaseServiceConfig } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type LimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type MemoryCounter = {
  count: number;
  resetAt: number;
};

// In-memory fallback. Only useful for a single process (local dev, tests) —
// serverless instances each keep their own counters.
const counters = new Map<string, MemoryCounter>();

function clientIp(request: Request) {
  // Take the LAST x-forwarded-for entry: entries are prepended by untrusted
  // hops, the final value is the one added by the trusted edge proxy.
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return (
    forwarded?.[forwarded.length - 1] ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function incrementMemory(key: string, windowSeconds: number) {
  const current = counters.get(key);
  const resetAt = Date.now() + windowSeconds * 1000;
  if (!current || current.resetAt <= Date.now()) {
    counters.set(key, { count: 1, resetAt });
    return 1;
  }

  current.count += 1;
  return current.count;
}

// Shared counter via an atomic Postgres RPC so the limit holds across all
// serverless instances. Returns undefined when the shared store is not
// configured or unreachable; callers fall back to the in-memory counter.
async function incrementShared(key: string, windowSeconds: number): Promise<number | undefined> {
  if (!hasSupabaseServiceConfig()) return undefined;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_key: key,
      p_window_seconds: windowSeconds,
    });
    if (error || typeof data !== "number") return undefined;
    return data;
  } catch {
    return undefined;
  }
}

export async function rateLimit(request: Request, options: LimitOptions) {
  // SEC-04: Only bypass rate limits in non-production environments.
  if (
    process.env.NODE_ENV !== "production" &&
    (process.env.CYPRESS_TEST_CLIENT_PRIVATE_KEY || process.env.CYPRESS_ACTIVE_ROLE)
  ) {
    return undefined;
  }
  const key = `worknet:ratelimit:${options.key}:${clientIp(request)}`;
  const count = (await incrementShared(key, options.windowSeconds)) ?? incrementMemory(key, options.windowSeconds);
  const remaining = Math.max(options.limit - count, 0);
  const headers = {
    "X-RateLimit-Limit": String(options.limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Window": String(options.windowSeconds),
  };

  if (count > options.limit) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers },
    );
  }

  return undefined;
}

export async function walletRateLimit(request: Request, walletOrProfileId: string, action: string) {
  return rateLimit(request, {
    key: `${action}:${walletOrProfileId.toLowerCase()}`,
    limit: 30,
    windowSeconds: 60,
  });
}
