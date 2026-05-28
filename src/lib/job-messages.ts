"use client";

import { useCallback, useMemo, useState } from "react";
import { apiJson, useWorkNetData } from "./store";

export type { JobMessage } from "./types";

export function useJobMessages(jobId: string) {
  const { state, isSyncing, refreshState } = useWorkNetData();
  const [pending, setPending] = useState(false);

  const messages = useMemo(
    () =>
      state.jobMessages
        .filter((m) => m.jobId === jobId)
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [state.jobMessages, jobId],
  );

  const postMessage = useCallback(
    (_authorProfileId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed || pending) return;
      setPending(true);
      void apiJson(`/api/jobs/${jobId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: trimmed }),
      })
        .then(() => refreshState())
        .catch(() => undefined)
        .finally(() => setPending(false));
    },
    [jobId, pending, refreshState],
  );

  return { messages, postMessage, hydrated: !isSyncing };
}
