"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApplicationStatus } from "./types";

const STORAGE_KEY = "arc-worknet:application-overlay:v1";

export type ApplicationOverlayEntry = {
  status: Extract<ApplicationStatus, "withdrawn" | "rejected">;
  reason?: string;
  updatedAt: string;
};

type Overlay = Record<string, ApplicationOverlayEntry>;

function isEntry(value: unknown): value is ApplicationOverlayEntry {
  if (value === null || typeof value !== "object") return false;
  const entry = value as { status?: unknown; updatedAt?: unknown };
  if (typeof entry.updatedAt !== "string") return false;
  return entry.status === "withdrawn" || entry.status === "rejected";
}

function readStorage(): Overlay {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Overlay = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof key === "string" && isEntry(value)) {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeStorage(overlay: Overlay) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
  } catch {
    // ignore
  }
}

export function useApplicationOverlay() {
  const [overlay, setOverlay] = useState<Overlay>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOverlay(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setOverlay(readStorage());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  const setEntry = useCallback((id: string, entry: ApplicationOverlayEntry) => {
    setOverlay((current) => {
      const next = { ...current, [id]: entry };
      writeStorage(next);
      return next;
    });
  }, []);

  const withdraw = useCallback(
    (id: string) => {
      setEntry(id, { status: "withdrawn", updatedAt: new Date().toISOString() });
    },
    [setEntry],
  );

  const decline = useCallback(
    (id: string, reason: string) => {
      setEntry(id, {
        status: "rejected",
        reason: reason.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
    },
    [setEntry],
  );

  const getEffectiveStatus = useCallback(
    (id: string, baseStatus: ApplicationStatus): ApplicationStatus => {
      const entry = overlay[id];
      if (!entry) return baseStatus;
      if (baseStatus === "accepted") return baseStatus;
      return entry.status;
    },
    [overlay],
  );

  const getDeclineReason = useCallback(
    (id: string) => overlay[id]?.reason,
    [overlay],
  );

  return { overlay, withdraw, decline, getEffectiveStatus, getDeclineReason, hydrated };
}
