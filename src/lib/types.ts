export type ProfileRole = "client" | "worker" | "agent_owner" | "admin";

export type Availability = "open" | "limited" | "unavailable";

export type PortfolioItem = {
  id: string;
  title: string;
  url?: string;
  description?: string;
};

export type JobStatus =
  | "draft"
  | "open"
  | "assigned"
  | "onchain_created"
  | "budget_set"
  | "funding_pending"
  | "funded"
  | "in_progress"
  | "submitted"
  | "revision_requested"
  | "completed"
  | "rejected"
  | "expired"
  | "cancelled"
  | "disputed";

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type SubmissionStatus = "submitted" | "revision_requested" | "approved" | "rejected";
export type ActorType = "human" | "agent";
export type TxStatus = "pending" | "confirmed" | "failed";

export type Profile = {
  id: string;
  displayName: string;
  handle: string;
  role: ProfileRole;
  bio: string;
  avatarUrl?: string;
  walletAddress: string;
  countryCode: string;
  timezone: string;
  skills: string[];
  hourlyRateUsdcUnits?: number;
  availability?: Availability;
  portfolio: PortfolioItem[];
  totalEarnedUsdcUnits: number;
  totalSpentUsdcUnits: number;
  completedJobsCount: number;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Agent = {
  id: string;
  ownerProfileId: string;
  name: string;
  slug: string;
  description: string;
  capabilities: string[];
  agentWalletAddress: string;
  metadataUri?: string;
  arcAgentId?: string;
  identityRegistryAddress?: string;
  reputationRegistryAddress?: string;
  validationRegistryAddress?: string;
  registrationTxHash?: string;
  reputationScore: number;
  jobsCompleted: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Job = {
  id: string;
  clientProfileId: string;
  providerProfileId?: string;
  providerAgentId?: string;
  actorType: ActorType;
  title: string;
  brief: string;
  acceptanceCriteria: string;
  deliverableFormat: string;
  category: string;
  tags: string[];
  budgetUsdcUnits: number;
  platformFeeBps: number;
  deadlineAt?: string;
  status: JobStatus;
  evaluatorAddress?: string;
  providerAddress?: string;
  arcChainId: number;
  arcContractAddress?: string;
  arcJobId?: string;
  hookAddress?: string;
  descriptionHash?: string;
  createTxHash?: string;
  setBudgetTxHash?: string;
  approveTxHash?: string;
  fundTxHash?: string;
  submitTxHash?: string;
  completeTxHash?: string;
  cancelTxHash?: string;
  lastIndexedBlock?: number;
  createdAt: string;
  updatedAt: string;
};

export type JobApplication = {
  id: string;
  jobId: string;
  applicantProfileId?: string;
  applicantAgentId?: string;
  actorType: ActorType;
  pitch: string;
  proposedBudgetUsdcUnits?: number;
  proposedDeadlineAt?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type JobSubmission = {
  id: string;
  jobId: string;
  submitterProfileId?: string;
  submitterAgentId?: string;
  notes: string;
  deliverableUrl: string;
  deliverableSha256?: string;
  deliverablePayload: Record<string, unknown>;
  deliverableHashBytes32?: string;
  status: SubmissionStatus;
  submitTxHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type JobReview = {
  id: string;
  jobId: string;
  reviewerProfileId: string;
  submissionId?: string;
  rating: number;
  reviewText: string;
  reasonHashBytes32?: string;
  completeTxHash?: string;
  reviewTxHash?: string;
  reviewTxMethod?: string;
  createdAt: string;
};

export type AiEvaluation = {
  id: string;
  jobId: string;
  submissionId: string;
  model: string;
  score: number;
  verdict: "pass" | "needs_revision" | "fail";
  summary: string;
  rubric: Record<string, unknown>;
  rawOutput: Record<string, unknown>;
  createdAt: string;
};

export type OnchainTransaction = {
  id: string;
  jobId?: string;
  profileId?: string;
  chainId: number;
  blockchain: string;
  contractAddress?: string;
  method: string;
  txHash: string;
  status: TxStatus;
  blockNumber?: number;
  errorMessage?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  confirmedAt?: string;
};

export type OnchainEvent = {
  id: string;
  chainId: number;
  blockchain: string;
  contractAddress: string;
  eventSignature: string;
  eventSignatureHash?: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  decoded: Record<string, unknown>;
  createdAt: string;
};

export type Notification = {
  id: string;
  profileId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  readAt?: string;
  createdAt: string;
};

export type JobMessage = {
  id: string;
  jobId: string;
  authorProfileId: string;
  body: string;
  createdAt: string;
};

export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled";

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

export type SavedJob = {
  profileId: string;
  jobId: string;
  createdAt: string;
};

export type ApplicationOverlayEntry = {
  applicationId: string;
  status: Extract<ApplicationStatus, "withdrawn" | "rejected">;
  reason?: string;
  actorProfileId?: string;
  updatedAt: string;
};

export type WorkNetState = {
  activeProfileId: string;
  profiles: Profile[];
  agents: Agent[];
  jobs: Job[];
  applications: JobApplication[];
  submissions: JobSubmission[];
  reviews: JobReview[];
  aiEvaluations: AiEvaluation[];
  transactions: OnchainTransaction[];
  events: OnchainEvent[];
  notifications: Notification[];
  jobMessages: JobMessage[];
  jobInvitations: JobInvitation[];
  savedJobs: SavedJob[];
  applicationOverlays: ApplicationOverlayEntry[];
};

export type WalletState = {
  address?: string;
  chainId?: number;
  usdcBalanceUnits?: number;
  balanceUpdatedAt?: string;
  isConnected: boolean;
};
