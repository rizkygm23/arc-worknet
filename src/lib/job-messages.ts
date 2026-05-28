"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "arc-worknet:job-messages:v1";

export type JobMessage = {
  id: string;
  jobId: string;
  authorProfileId: string;
  body: string;
  createdAt: string;
};

const SEED: JobMessage[] = [
  {
    id: "msg_seed_indexer_1",
    jobId: "job_open_indexer",
    authorProfileId: "profile_client_ada",
    body: "Hi Mira — quick check: is the indexer expected to backfill from genesis or from the contract deployment block?",
    createdAt: "2026-05-23T10:05:00.000Z",
  },
  {
    id: "msg_seed_indexer_2",
    jobId: "job_open_indexer",
    authorProfileId: "profile_worker_mira",
    body: "Deployment block. I'll parameterize the cursor so we can replay from any height for QA.",
    createdAt: "2026-05-23T10:18:00.000Z",
  },
  {
    id: "msg_seed_eval_1",
    jobId: "job_agent_eval",
    authorProfileId: "profile_client_ada",
    body: "Submission looks good. Two medium findings make sense — let me know once the patch proposal lands.",
    createdAt: "2026-05-24T03:02:00.000Z",
  },
];

function readStorage(): JobMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is JobMessage =>
        item != null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.jobId === "string" &&
        typeof item.authorProfileId === "string" &&
        typeof item.body === "string" &&
        typeof item.createdAt === "string",
    );
  } catch {
    return [];
  }
}

function writeStorage(messages: JobMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

function mergeWithSeed(stored: JobMessage[]): JobMessage[] {
  const ids = new Set(stored.map((m) => m.id));
  const seeded = SEED.filter((m) => !ids.has(m.id));
  return [...seeded, ...stored];
}

export function useJobMessages(jobId: string) {
  const [messages, setMessages] = useState<JobMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMessages(mergeWithSeed(readStorage()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setMessages(mergeWithSeed(readStorage()));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  const jobMessages = useMemo(
    () =>
      messages
        .filter((m) => m.jobId === jobId)
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages, jobId],
  );

  const postMessage = useCallback(
    (authorProfileId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const message: JobMessage = {
        id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        jobId,
        authorProfileId,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => {
        const next = [...current, message];
        const userPosted = next.filter((m) => !SEED.some((s) => s.id === m.id));
        writeStorage(userPosted);
        return next;
      });
    },
    [jobId],
  );

  return { messages: jobMessages, postMessage, hydrated };
}
