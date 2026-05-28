"use client";

import { useCallback, useMemo, useState } from "react";
import { apiJson, useWorkNetData } from "./store";
import type { ApplicationOverlayEntry, ApplicationStatus } from "./types";

export type { ApplicationOverlayEntry } from "./types";

export function useApplicationOverlay() {
  const { state, isSyncing, refreshState } = useWorkNetData();
  const [pending, setPending] = useState(false);

  const overlay = useMemo(() => {
    const map: Record<string, ApplicationOverlayEntry> = {};
    for (const entry of state.applicationOverlays) {
      map[entry.applicationId] = entry;
    }
    return map;
  }, [state.applicationOverlays]);

  const patchOverlay = useCallback(
    (id: string, body: { status: "withdrawn" | "rejected"; reason?: string }) => {
      if (pending) return;
      setPending(true);
      void apiJson(`/api/applications/${id}/overlay`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
        .then(() => refreshState())
        .catch(() => undefined)
        .finally(() => setPending(false));
    },
    [pending, refreshState],
  );

  const withdraw = useCallback(
    (id: string) => {
      patchOverlay(id, { status: "withdrawn" });
    },
    [patchOverlay],
  );

  const decline = useCallback(
    (id: string, reason: string) => {
      const trimmed = reason.trim();
      patchOverlay(id, { status: "rejected", reason: trimmed || undefined });
    },
    [patchOverlay],
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

  const getDeclineReason = useCallback((id: string) => overlay[id]?.reason, [overlay]);

  return {
    overlay,
    withdraw,
    decline,
    getEffectiveStatus,
    getDeclineReason,
    hydrated: !isSyncing,
  };
}
