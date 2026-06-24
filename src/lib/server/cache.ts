import { createHash } from "node:crypto";
import { broadcastBootstrapBump } from "./realtime";

// In-memory cache for the public bootstrap response. The payload is identical
// for every caller (public marketplace data only), so we serialize it once and
// serve the same bytes until a mutation invalidates it or the TTL lapses.
//
// Scope caveat: this Map lives in a single server process. On a multi-instance
// deployment each instance keeps its own copy; the Realtime bump + short TTL
// keep them converged within seconds, which is the same staleness budget the
// client polling fallback already tolerates.
type CacheEntry = { json: string; etag: string; createdAt: number };

const PUBLIC_BOOTSTRAP_TTL_MS = 10_000;

let publicBootstrap: CacheEntry | undefined;

export function getPublicBootstrapCache(): CacheEntry | undefined {
  if (!publicBootstrap) return undefined;
  if (Date.now() - publicBootstrap.createdAt > PUBLIC_BOOTSTRAP_TTL_MS) {
    publicBootstrap = undefined;
    return undefined;
  }
  return publicBootstrap;
}

export function setPublicBootstrapCache(json: string): CacheEntry {
  const etag = `"${createHash("sha256").update(json).digest("hex").slice(0, 32)}"`;
  publicBootstrap = { json, etag, createdAt: Date.now() };
  return publicBootstrap;
}

function clearPublicBootstrapCache() {
  publicBootstrap = undefined;
}

export async function invalidateBootstrapCache() {
  clearPublicBootstrapCache();
  void broadcastBootstrapBump();
}
