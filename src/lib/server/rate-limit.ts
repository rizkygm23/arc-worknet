import { NextResponse } from "next/server";

type LimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type MemoryCounter = {
  count: number;
  resetAt: number;
};

const counters = new Map<string, MemoryCounter>();

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwarded ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function increment(key: string, windowSeconds: number) {
  const current = counters.get(key);
  const resetAt = Date.now() + windowSeconds * 1000;
  if (!current || current.resetAt <= Date.now()) {
    counters.set(key, { count: 1, resetAt });
    return 1;
  }

  current.count += 1;
  return current.count;
}

export async function rateLimit(request: Request, options: LimitOptions) {
  const key = `arcworknet:ratelimit:${options.key}:${clientIp(request)}`;
  const count = increment(key, options.windowSeconds);
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
