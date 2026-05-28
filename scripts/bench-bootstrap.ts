/* eslint-disable no-console */
/**
 * Bench: Redis cache vs direct Supabase for /api/bootstrap public payload.
 *
 * Run:
 *   npx tsx scripts/bench-bootstrap.ts [iterations] [warmups]
 *
 * Defaults: 20 iterations, 3 warmups.
 *
 * Reports min / p50 / p95 / max / mean for each strategy.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const REDIS_URL = process.env.REDIS_REST_URL ?? "";
const REDIS_TOKEN = process.env.REDIS_REST_TOKEN ?? "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!REDIS_URL || !REDIS_TOKEN) {
  console.error("Missing REDIS_REST_URL or REDIS_REST_TOKEN");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PUBLIC_JOB_STATUSES = [
  "open",
  "assigned",
  "onchain_created",
  "budget_set",
  "funded",
  "submitted",
  "revision_requested",
  "completed",
];

const T = {
  profiles: "profiles_arcworker",
  agents: "agents_arcworker",
  jobs: "jobs_arcworker",
  events: "onchain_events_arcworker",
  transactions: "onchain_transactions_arcworker",
};

async function redisCommand<T>(command: unknown[]): Promise<T | undefined> {
  const r = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const body = (await r.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!r.ok || body.error) {
    if (process.env.BENCH_DEBUG === "1") {
      console.warn(`[redis ${command[0]}] http=${r.status} err=${body.error ?? "(none)"}`);
    }
    return undefined;
  }
  return body.result;
}

async function fetchPublicFromSupabase() {
  const [profiles, agents, jobs, events] = await Promise.all([
    supabase.from(T.profiles).select("*").eq("is_blocked", false).order("created_at", { ascending: false }),
    supabase.from(T.agents).select("*").eq("is_public", true).order("created_at", { ascending: false }),
    supabase.from(T.jobs).select("*").in("status", PUBLIC_JOB_STATUSES).order("created_at", { ascending: false }),
    supabase.from(T.events).select("*").order("block_number", { ascending: false }).limit(200),
  ]);
  for (const r of [profiles, agents, jobs, events]) {
    if (r.error) throw new Error(r.error.message);
  }
  const jobIds = (jobs.data ?? []).map((j: { id: string }) => j.id);
  let transactions: unknown[] = [];
  if (jobIds.length > 0) {
    const tx = await supabase
      .from(T.transactions)
      .select("*")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false })
      .limit(100);
    if (tx.error) throw new Error(tx.error.message);
    transactions = tx.data ?? [];
  }
  return {
    profiles: profiles.data ?? [],
    agents: agents.data ?? [],
    jobs: jobs.data ?? [],
    events: events.data ?? [],
    transactions,
  };
}

const CACHE_KEY_PREFIX = "arcworknet:bench:bootstrap:";
const VERSION_KEY = "arcworknet:bench:bootstrap:version";
const TTL_SECONDS = 60;

async function getCacheVersion(): Promise<number> {
  const v = await redisCommand<string | number>(["GET", VERSION_KEY]);
  if (v === undefined || v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function getJsonCache<T>(key: string): Promise<T | undefined> {
  const raw = await redisCommand<string>(["GET", key]);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

async function setJsonCache(key: string, value: unknown, ttl: number) {
  await redisCommand<string>(["SET", key, JSON.stringify(value), "EX", ttl]);
}

async function fetchPublicViaRedis() {
  const version = await getCacheVersion();
  const key = `${CACHE_KEY_PREFIX}${version}`;
  const cached = await getJsonCache<unknown>(key);
  if (cached !== undefined) return { source: "cache", payload: cached };
  const fresh = await fetchPublicFromSupabase();
  await setJsonCache(key, fresh, TTL_SECONDS);
  return { source: "miss", payload: fresh };
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function summarize(label: string, durationsMs: number[], extra: Record<string, number> = {}) {
  const sorted = [...durationsMs].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  console.log(
    `\n${label}\n` +
      `  n      = ${sorted.length}\n` +
      `  min    = ${sorted[0].toFixed(1)} ms\n` +
      `  p50    = ${pct(sorted, 50).toFixed(1)} ms\n` +
      `  p95    = ${pct(sorted, 95).toFixed(1)} ms\n` +
      `  max    = ${sorted[sorted.length - 1].toFixed(1)} ms\n` +
      `  mean   = ${mean.toFixed(1)} ms` +
      Object.entries(extra)
        .map(([k, v]) => `\n  ${k.padEnd(6)} = ${v}`)
        .join(""),
  );
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const start = performance.now();
  const value = await fn();
  return { ms: performance.now() - start, value };
}

async function main() {
  const iterations = Number(process.argv[2] ?? 20);
  const warmups = Number(process.argv[3] ?? 3);

  console.log(
    `Bench bootstrap public payload\n` +
      `  iterations = ${iterations}\n` +
      `  warmups    = ${warmups}\n` +
      `  redis url  = ${new URL(REDIS_URL).host}\n` +
      `  supabase   = ${new URL(SUPABASE_URL).host}\n`,
  );

  // Warmup both paths so first-hit cold start doesn't skew stats.
  for (let i = 0; i < warmups; i += 1) {
    await fetchPublicFromSupabase().catch(() => undefined);
    await fetchPublicViaRedis().catch(() => undefined);
  }

  // Direct Supabase
  const direct: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const { ms } = await timed(() => fetchPublicFromSupabase());
    direct.push(ms);
  }
  summarize("Direct Supabase (4-5 parallel queries)", direct);

  // Redis-cached (warm — first call may be miss; subsequent should be hits within TTL)
  let cacheHits = 0;
  let cacheMisses = 0;
  const cached: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const { ms, value } = await timed(() => fetchPublicViaRedis());
    cached.push(ms);
    if (value.source === "cache") cacheHits += 1;
    else cacheMisses += 1;
  }
  summarize("Redis-cached (GET version + GET payload)", cached, {
    hits: cacheHits,
    misses: cacheMisses,
  });

  // Redis-only (just to isolate the network cost of two Upstash REST calls)
  const redisOnly: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const { ms } = await timed(async () => {
      await redisCommand<string>(["GET", VERSION_KEY]);
      await redisCommand<string>(["GET", `${CACHE_KEY_PREFIX}probe`]);
    });
    redisOnly.push(ms);
  }
  summarize("Redis only (2 sequential GETs, no Supabase)", redisOnly);

  console.log("\nDone.");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
