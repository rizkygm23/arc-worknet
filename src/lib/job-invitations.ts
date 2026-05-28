"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "arc-worknet:job-invitations:v1";

export type InvitationStatus = "pending" | "accepted" | "declined";

export type JobInvitation = {
  id: string;
  jobId: string;
  fromClientProfileId: string;
  toWorkerProfileId: string;
  message: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt?: string;
};

const SEED: JobInvitation[] = [
  {
    id: "inv_seed_indexer_mira",
    jobId: "job_open_indexer",
    fromClientProfileId: "profile_client_ada",
    toWorkerProfileId: "profile_worker_mira",
    message:
      "Mira — this Arc indexer scope is in your sweet spot. Would love to have you on it. Let me know.",
    status: "pending",
    createdAt: "2026-05-23T08:15:00.000Z",
  },
];

function readStorage(): JobInvitation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is JobInvitation =>
        item != null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.jobId === "string" &&
        typeof item.fromClientProfileId === "string" &&
        typeof item.toWorkerProfileId === "string" &&
        typeof item.message === "string" &&
        typeof item.status === "string" &&
        typeof item.createdAt === "string",
    );
  } catch {
    return [];
  }
}

function writeStorage(items: JobInvitation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function mergeWithSeed(stored: JobInvitation[]): JobInvitation[] {
  const ids = new Set(stored.map((i) => i.id));
  const seeded = SEED.filter((i) => !ids.has(i.id));
  return [...seeded, ...stored];
}

export function useJobInvitations() {
  const [invitations, setInvitations] = useState<JobInvitation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInvitations(mergeWithSeed(readStorage()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setInvitations(mergeWithSeed(readStorage()));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  const persistChanges = useCallback((next: JobInvitation[]) => {
    const userOnly = next
      .map((entry) => {
        const seed = SEED.find((s) => s.id === entry.id);
        if (!seed) return entry;
        if (seed.status === entry.status && seed.message === entry.message) return null;
        return entry;
      })
      .filter((entry): entry is JobInvitation => entry !== null);
    writeStorage(userOnly);
  }, []);

  const sendInvite = useCallback(
    (input: { jobId: string; fromClientProfileId: string; toWorkerProfileId: string; message: string }) => {
      const message = input.message.trim();
      if (!message) return;
      const invitation: JobInvitation = {
        id: `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        jobId: input.jobId,
        fromClientProfileId: input.fromClientProfileId,
        toWorkerProfileId: input.toWorkerProfileId,
        message,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setInvitations((current) => {
        const next = [...current, invitation];
        persistChanges(next);
        return next;
      });
    },
    [persistChanges],
  );

  const respondInvite = useCallback(
    (invitationId: string, status: "accepted" | "declined") => {
      setInvitations((current) => {
        const next = current.map((entry) =>
          entry.id === invitationId
            ? { ...entry, status, respondedAt: new Date().toISOString() }
            : entry,
        );
        persistChanges(next);
        return next;
      });
    },
    [persistChanges],
  );

  return { invitations, sendInvite, respondInvite, hydrated };
}
