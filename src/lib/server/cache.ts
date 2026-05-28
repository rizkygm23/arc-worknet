import { broadcastBootstrapBump } from "./realtime";
import { redisCommand } from "./redis";

type MemoryEntry = {
  value: string;
  expiresAt: number;
};

const memoryCache = new Map<string, MemoryEntry>();
const memoryVersions = new Map<string, number>();

function now() {
  return Date.now();
}

export async function getCacheVersion(scope: string) {
  const redisVersion = await redisCommand<string | number>(["GET", `arcworknet:${scope}:version`]);
  if (redisVersion !== undefined) {
    const parsed = Number(redisVersion);
    if (Number.isFinite(parsed)) return parsed;
  }

  return memoryVersions.get(scope) ?? 0;
}

export async function bumpCacheVersion(scope: string) {
  const nextVersion = (memoryVersions.get(scope) ?? 0) + 1;
  memoryVersions.set(scope, nextVersion);
  await redisCommand<number>(["INCR", `arcworknet:${scope}:version`]);
}

export async function getJsonCache<T>(key: string): Promise<T | undefined> {
  const redisValue = await redisCommand<string>(["GET", key]);
  if (redisValue) {
    return JSON.parse(redisValue) as T;
  }

  const entry = memoryCache.get(key);
  if (!entry || entry.expiresAt <= now()) {
    memoryCache.delete(key);
    return undefined;
  }

  return JSON.parse(entry.value) as T;
}

export async function setJsonCache(key: string, value: unknown, ttlSeconds: number) {
  const serialized = JSON.stringify(value);
  memoryCache.set(key, {
    value: serialized,
    expiresAt: now() + ttlSeconds * 1000,
  });
  await redisCommand<string>(["SET", key, serialized, "EX", ttlSeconds]);
}

export async function cachedJson<T>(key: string, ttlSeconds: number, loader: () => Promise<T>) {
  const cached = await getJsonCache<T>(key);
  if (cached !== undefined) return cached;

  const value = await loader();
  await setJsonCache(key, value, ttlSeconds);
  return value;
}

export async function invalidateBootstrapCache() {
  void broadcastBootstrapBump();
}
