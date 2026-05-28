"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "arc-worknet:saved-jobs:v1";

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // quota exceeded or disabled — ignore
  }
}

export function useSavedJobs() {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSavedIds(new Set(readStorage()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setSavedIds(new Set(readStorage()));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  const isSaved = useCallback((jobId: string) => savedIds.has(jobId), [savedIds]);

  const toggleSaved = useCallback((jobId: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      writeStorage(Array.from(next));
      return next;
    });
  }, []);

  return { savedIds, isSaved, toggleSaved, hydrated };
}
