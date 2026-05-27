import type { JobStatus } from "./types";

export const statusLabels: Record<JobStatus, string> = {
  draft: "Draft",
  open: "Open",
  assigned: "Assigned",
  onchain_created: "Onchain created",
  budget_set: "Budget set",
  funding_pending: "Funding pending",
  funded: "Funded",
  in_progress: "In progress",
  submitted: "Submitted",
  revision_requested: "Revision requested",
  completed: "Completed",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const lifecycle: JobStatus[] = [
  "draft",
  "open",
  "assigned",
  "onchain_created",
  "budget_set",
  "funding_pending",
  "funded",
  "submitted",
  "completed",
];

export function statusRank(status: JobStatus) {
  const index = lifecycle.indexOf(status);
  return index === -1 ? 0 : index;
}

export function isTerminalStatus(status: JobStatus) {
  return ["completed", "rejected", "expired", "cancelled", "disputed"].includes(status);
}
