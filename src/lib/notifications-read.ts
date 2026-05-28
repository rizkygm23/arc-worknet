"use client";

import { useCallback, useMemo, useState } from "react";
import { apiJson, useWorkNetData } from "./store";

export function useReadNotifications() {
  const { state, isSyncing, refreshState, activeProfile } = useWorkNetData();
  const [pending, setPending] = useState(false);

  const readIds = useMemo(() => {
    const set = new Set<string>();
    const profileId = activeProfile?.id;
    if (!profileId) return set;
    for (const n of state.notifications) {
      if (n.profileId === profileId && n.readAt) set.add(n.id);
    }
    return set;
  }, [state.notifications, activeProfile?.id]);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const markRead = useCallback(
    (id: string) => {
      if (pending || readIds.has(id)) return;
      setPending(true);
      void apiJson(`/api/notifications/${id}/read`, { method: "POST" })
        .then(() => refreshState())
        .catch(() => undefined)
        .finally(() => setPending(false));
    },
    [pending, readIds, refreshState],
  );

  const markAllReadInner = useCallback(() => {
    if (pending) return;
    setPending(true);
    void apiJson("/api/notifications/read-all", { method: "POST" })
      .then(() => refreshState())
      .catch(() => undefined)
      .finally(() => setPending(false));
  }, [pending, refreshState]);

  const markAllRead: (ids?: string[]) => void = useCallback(
    () => markAllReadInner(),
    [markAllReadInner],
  );

  return { isRead, markRead, markAllRead, hydrated: !isSyncing };
}
