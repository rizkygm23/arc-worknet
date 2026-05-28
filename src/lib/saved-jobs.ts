"use client";

import { useCallback, useMemo, useState } from "react";
import { apiJson, useWorkNetData } from "./store";

export function useSavedJobs() {
  const { state, isSyncing, refreshState } = useWorkNetData();
  const [pending, setPending] = useState(false);

  const savedIds = useMemo(
    () => new Set(state.savedJobs.map((s) => s.jobId)),
    [state.savedJobs],
  );

  const isSaved = useCallback((jobId: string) => savedIds.has(jobId), [savedIds]);

  const toggleSaved = useCallback(
    (jobId: string) => {
      if (pending) return;
      const currentlySaved = savedIds.has(jobId);
      setPending(true);
      const request = currentlySaved
        ? apiJson(`/api/saved-jobs?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" })
        : apiJson("/api/saved-jobs", { method: "POST", body: JSON.stringify({ jobId }) });
      void request
        .then(() => refreshState())
        .catch(() => undefined)
        .finally(() => setPending(false));
    },
    [pending, refreshState, savedIds],
  );

  return { savedIds, isSaved, toggleSaved, hydrated: !isSyncing };
}
