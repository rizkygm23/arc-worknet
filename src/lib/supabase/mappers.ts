import type {
  Agent,
  AiEvaluation,
  ApplicationOverlayEntry,
  Job,
  JobApplication,
  JobInvitation,
  JobMessage,
  JobReview,
  JobSubmission,
  Notification,
  OnchainEvent,
  OnchainTransaction,
  PortfolioItem,
  Profile,
  SavedJob,
  WorkNetState,
} from "@/lib/types";
import { decryptJson, decryptText } from "@/lib/server/encryption";
import type { Database, Json } from "./server";

type Tables = Database["public"]["Tables"];

export type BootstrapRows = {
  profiles: Tables["profiles_arcworker"]["Row"][];
  agents: Tables["agents_arcworker"]["Row"][];
  jobs: Tables["jobs_arcworker"]["Row"][];
  applications: Tables["job_applications_arcworker"]["Row"][];
  submissions: Tables["job_submissions_arcworker"]["Row"][];
  reviews: Tables["job_reviews_arcworker"]["Row"][];
  aiEvaluations: Tables["ai_evaluations_arcworker"]["Row"][];
  transactions: Tables["onchain_transactions_arcworker"]["Row"][];
  events: Tables["onchain_events_arcworker"]["Row"][];
  notifications: Tables["notifications_arcworker"]["Row"][];
  jobMessages: Tables["job_messages_arcworker"]["Row"][];
  jobInvitations: Tables["job_invitations_arcworker"]["Row"][];
  savedJobs: Tables["saved_jobs_arcworker"]["Row"][];
  applicationOverlays: Tables["application_status_overlay_arcworker"]["Row"][];
};

function nullable<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

function jsonRecord(value: Json): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function portfolioFromJson(value: Json): PortfolioItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `portfolio_${index}`,
      title: typeof item.title === "string" ? item.title : "Untitled",
      url: typeof item.url === "string" ? item.url : undefined,
      description: typeof item.description === "string" ? item.description : undefined,
    }));
}

function handleFromWallet(walletAddress: string, id: string) {
  return walletAddress
    ? `wallet-${walletAddress.slice(2, 8).toLowerCase()}`
    : `profile-${id.slice(0, 8)}`;
}

export function mapProfile(row: Tables["profiles_arcworker"]["Row"]): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    handle: row.handle ?? handleFromWallet(row.wallet_address, row.id),
    role: row.role,
    bio: row.bio ?? "",
    avatarUrl: nullable(row.avatar_url),
    walletAddress: row.wallet_address,
    countryCode: row.country_code ?? "",
    timezone: row.timezone ?? "",
    skills: row.skills ?? [],
    hourlyRateUsdcUnits: nullable(row.hourly_rate_usdc_units),
    availability: nullable(row.availability),
    portfolio: portfolioFromJson(row.portfolio),
    totalEarnedUsdcUnits: row.total_earned_usdc_units,
    totalSpentUsdcUnits: row.total_spent_usdc_units,
    completedJobsCount: row.completed_jobs_count,
    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count,
    isVerified: row.is_verified,
    isBlocked: row.is_blocked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAgent(row: Tables["agents_arcworker"]["Row"]): Agent {
  return {
    id: row.id,
    ownerProfileId: row.owner_profile_id,
    name: row.name,
    slug: row.slug ?? row.id,
    description: row.description ?? "",
    capabilities: row.capabilities,
    agentWalletAddress: row.agent_wallet_address ?? "",
    metadataUri: nullable(row.metadata_uri),
    arcAgentId: nullable(row.arc_agent_id),
    identityRegistryAddress: nullable(row.identity_registry_address),
    reputationRegistryAddress: nullable(row.reputation_registry_address),
    validationRegistryAddress: nullable(row.validation_registry_address),
    registrationTxHash: nullable(row.registration_tx_hash),
    reputationScore: row.reputation_score,
    jobsCompleted: row.jobs_completed,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapJob(row: Tables["jobs_arcworker"]["Row"]): Job {
  return {
    id: row.id,
    clientProfileId: row.client_profile_id,
    providerProfileId: nullable(row.provider_profile_id),
    providerAgentId: nullable(row.provider_agent_id),
    actorType: row.actor_type,
    title: row.title,
    brief: row.brief,
    acceptanceCriteria: row.acceptance_criteria,
    deliverableFormat: row.deliverable_format ?? "",
    category: row.category ?? "General",
    tags: row.tags,
    budgetUsdcUnits: row.budget_usdc_units,
    platformFeeBps: row.platform_fee_bps,
    deadlineAt: nullable(row.deadline_at),
    status: row.status,
    evaluatorAddress: nullable(row.evaluator_address),
    providerAddress: nullable(row.provider_address),
    arcChainId: row.arc_chain_id,
    arcContractAddress: nullable(row.arc_contract_address),
    arcJobId: nullable(row.arc_job_id),
    hookAddress: nullable(row.hook_address),
    descriptionHash: nullable(row.description_hash),
    createTxHash: nullable(row.create_tx_hash),
    setBudgetTxHash: nullable(row.set_budget_tx_hash),
    approveTxHash: nullable(row.approve_tx_hash),
    fundTxHash: nullable(row.fund_tx_hash),
    submitTxHash: nullable(row.submit_tx_hash),
    completeTxHash: nullable(row.complete_tx_hash),
    cancelTxHash: nullable(row.cancel_tx_hash),
    lastIndexedBlock: nullable(row.last_indexed_block),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapApplication(row: Tables["job_applications_arcworker"]["Row"]): JobApplication {
  return {
    id: row.id,
    jobId: row.job_id,
    applicantProfileId: nullable(row.applicant_profile_id),
    applicantAgentId: nullable(row.applicant_agent_id),
    actorType: row.actor_type,
    pitch: row.pitch,
    proposedBudgetUsdcUnits: nullable(row.proposed_budget_usdc_units),
    proposedDeadlineAt: nullable(row.proposed_deadline_at),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSubmission(row: Tables["job_submissions_arcworker"]["Row"]): JobSubmission {
  const payload = decryptJson(jsonRecord(row.deliverable_payload));
  const meta = (payload?.fileMeta ?? {}) as {
    mimeType?: string;
    fileName?: string;
    sizeBytes?: number;
  };
  return {
    id: row.id,
    jobId: row.job_id,
    submitterProfileId: nullable(row.submitter_profile_id),
    submitterAgentId: nullable(row.submitter_agent_id),
    notes: decryptText(row.notes),
    deliverableUrl: decryptText(row.deliverable_url) || undefined,
    deliverableSha256: nullable(row.deliverable_sha256),
    // NOTE: deliverable_storage_path is intentionally NOT mapped to the client.
    // File access is always brokered through the gated /deliverable endpoint so
    // a locked deliverable can never be reached directly from client state.
    deliverableMimeType: meta.mimeType,
    deliverableFileName: meta.fileName,
    deliverableSizeBytes: typeof meta.sizeBytes === "number" ? meta.sizeBytes : undefined,
    deliverablePayload: payload,
    deliverableHashBytes32: nullable(row.deliverable_hash_bytes32),
    status: row.status,
    submitTxHash: nullable(row.submit_tx_hash),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReview(row: Tables["job_reviews_arcworker"]["Row"]): JobReview {
  return {
    id: row.id,
    jobId: row.job_id,
    reviewerProfileId: row.reviewer_profile_id,
    submissionId: nullable(row.submission_id),
    rating: row.rating ?? 0,
    reviewText: decryptText(row.review_text),
    reasonHashBytes32: nullable(row.reason_hash_bytes32),
    completeTxHash: nullable(row.complete_tx_hash),
    reviewTxHash: nullable(row.review_tx_hash),
    reviewTxMethod: nullable(row.review_tx_method),
    createdAt: row.created_at,
  };
}

export function mapAiEvaluation(row: Tables["ai_evaluations_arcworker"]["Row"]): AiEvaluation {
  return {
    id: row.id,
    jobId: row.job_id,
    submissionId: row.submission_id,
    model: row.model,
    score: row.score ?? 0,
    verdict: row.verdict ?? "needs_revision",
    summary: row.summary ?? "",
    rubric: jsonRecord(row.rubric),
    rawOutput: jsonRecord(row.raw_output),
    createdAt: row.created_at,
  };
}

export function mapTransaction(row: Tables["onchain_transactions_arcworker"]["Row"]): OnchainTransaction {
  return {
    id: row.id,
    jobId: nullable(row.job_id),
    profileId: nullable(row.profile_id),
    chainId: row.chain_id,
    blockchain: row.blockchain,
    contractAddress: nullable(row.contract_address),
    method: row.method ?? "unknown",
    txHash: row.tx_hash ?? "",
    status: row.status,
    blockNumber: nullable(row.block_number),
    errorMessage: nullable(row.error_message),
    metadata: jsonRecord(row.metadata),
    createdAt: row.created_at,
    confirmedAt: nullable(row.confirmed_at),
  };
}

export function mapEvent(row: Tables["onchain_events_arcworker"]["Row"]): OnchainEvent {
  return {
    id: row.id,
    chainId: row.chain_id,
    blockchain: row.blockchain,
    contractAddress: row.contract_address,
    eventSignature: row.event_signature,
    eventSignatureHash: nullable(row.event_signature_hash),
    txHash: row.tx_hash,
    blockNumber: row.block_number,
    logIndex: row.log_index,
    decoded: jsonRecord(row.decoded),
    createdAt: row.created_at,
  };
}

export function mapNotification(row: Tables["notifications_arcworker"]["Row"]): Notification {
  return {
    id: row.id,
    profileId: row.profile_id,
    type: row.type,
    title: row.title,
    body: row.body ?? "",
    href: nullable(row.href),
    readAt: nullable(row.read_at),
    createdAt: row.created_at,
  };
}

export function mapJobMessage(row: Tables["job_messages_arcworker"]["Row"]): JobMessage {
  return {
    id: row.id,
    jobId: row.job_id,
    authorProfileId: row.author_profile_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function mapJobInvitation(row: Tables["job_invitations_arcworker"]["Row"]): JobInvitation {
  return {
    id: row.id,
    jobId: row.job_id,
    fromClientProfileId: row.from_client_profile_id,
    toWorkerProfileId: row.to_worker_profile_id,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: nullable(row.responded_at),
  };
}

export function mapSavedJob(row: Tables["saved_jobs_arcworker"]["Row"]): SavedJob {
  return {
    profileId: row.profile_id,
    jobId: row.job_id,
    createdAt: row.created_at,
  };
}

export function mapApplicationOverlay(
  row: Tables["application_status_overlay_arcworker"]["Row"],
): ApplicationOverlayEntry {
  return {
    applicationId: row.application_id,
    status: row.status,
    reason: nullable(row.reason),
    actorProfileId: nullable(row.actor_profile_id),
    updatedAt: row.updated_at,
  };
}

export function toWorkNetState(rows: BootstrapRows, activeProfileId = ""): WorkNetState {
  return {
    activeProfileId,
    profiles: rows.profiles.map(mapProfile),
    agents: rows.agents.map(mapAgent),
    jobs: rows.jobs.map(mapJob),
    applications: rows.applications.map(mapApplication),
    submissions: rows.submissions.map(mapSubmission),
    reviews: rows.reviews.map(mapReview),
    aiEvaluations: rows.aiEvaluations.map(mapAiEvaluation),
    transactions: rows.transactions.map(mapTransaction),
    events: rows.events.map(mapEvent),
    notifications: rows.notifications.map(mapNotification),
    jobMessages: rows.jobMessages.map(mapJobMessage),
    jobInvitations: rows.jobInvitations.map(mapJobInvitation),
    savedJobs: rows.savedJobs.map(mapSavedJob),
    applicationOverlays: rows.applicationOverlays.map(mapApplicationOverlay),
  };
}
