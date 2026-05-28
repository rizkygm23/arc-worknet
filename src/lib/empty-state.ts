import type { WorkNetState } from "./types";

export const emptyState: WorkNetState = {
  activeProfileId: "",
  profiles: [],
  agents: [],
  jobs: [],
  applications: [],
  submissions: [],
  reviews: [],
  aiEvaluations: [],
  transactions: [],
  events: [],
  notifications: [],
  jobMessages: [],
  jobInvitations: [],
  savedJobs: [],
  applicationOverlays: [],
};
