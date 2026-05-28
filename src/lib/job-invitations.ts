"use client";

import { useCallback, useState } from "react";
import { apiJson, useWorkNetData } from "./store";

export type { JobInvitation, InvitationStatus } from "./types";

export function useJobInvitations() {
  const { state, isSyncing, refreshState } = useWorkNetData();
  const [pending, setPending] = useState(false);

  const sendInvite = useCallback(
    (input: { jobId: string; fromClientProfileId: string; toWorkerProfileId: string; message: string }) => {
      const message = input.message.trim();
      if (!message || pending) return;
      setPending(true);
      void apiJson(`/api/jobs/${input.jobId}/invitations`, {
        method: "POST",
        body: JSON.stringify({
          toWorkerProfileId: input.toWorkerProfileId,
          message,
        }),
      })
        .then(() => refreshState())
        .catch(() => undefined)
        .finally(() => setPending(false));
    },
    [pending, refreshState],
  );

  const respondInvite = useCallback(
    (invitationId: string, status: "accepted" | "declined") => {
      if (pending) return;
      setPending(true);
      void apiJson(`/api/invitations/${invitationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
        .then(() => refreshState())
        .catch(() => undefined)
        .finally(() => setPending(false));
    },
    [pending, refreshState],
  );

  return {
    invitations: state.jobInvitations,
    sendInvite,
    respondInvite,
    hydrated: !isSyncing,
  };
}
