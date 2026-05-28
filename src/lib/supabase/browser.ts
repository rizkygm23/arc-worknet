"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./server";

let cached: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getBrowserSupabase() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return undefined;
  cached = createBrowserClient<Database>(url, anon);
  return cached;
}
