import { env } from "@/lib/env";

type RedisRestResponse<T> = {
  result?: T;
  error?: string;
};

let redisDisabled = false;

export function hasRedisConfig() {
  return Boolean(env.REDIS_REST_URL && env.REDIS_REST_TOKEN) && !redisDisabled;
}

export async function redisCommand<T>(command: unknown[]): Promise<T | undefined> {
  if (!hasRedisConfig()) return undefined;

  try {
    const response = await fetch(env.REDIS_REST_URL ?? "", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as RedisRestResponse<T>;
    if (!response.ok || body.error) {
      if (response.status === 401 || response.status === 403) {
        redisDisabled = true;
        console.warn(`[redis] disabled after ${response.status}: ${body.error ?? "auth failure"}`);
      }
      return undefined;
    }
    return body.result;
  } catch {
    return undefined;
  }
}
