"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "arc-worknet:notifications-read:v1";

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
    // ignore
  }
}

export function useReadNotifications() {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadIds(new Set(readStorage()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setReadIds(new Set(readStorage()));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const markRead = useCallback((id: string) => {
    setReadIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      writeStorage(Array.from(next));
      return next;
    });
  }, []);

  const markAllRead = useCallback((ids: string[]) => {
    setReadIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      if (!changed) return current;
      writeStorage(Array.from(next));
      return next;
    });
  }, []);

  return { isRead, markRead, markAllRead, hydrated };
}
