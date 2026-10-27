"use client";

import clsx from "clsx";
import {
  Award,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Bot,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  FileCheck2,
  FileUp,
  Lock,
  Repeat,
  Star,
  TrendingUp,
  Zap,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { explorerTxUrl } from "@/lib/arc";
import { formatUsdcUnits } from "@/lib/money";
import { agentBadges, profileBadges, type ReputationBadge } from "@/lib/reputation";
import { statusLabels, statusRank } from "@/lib/status";
import type { Agent, Job, JobReview, JobStatus, Profile } from "@/lib/types";

const BADGE_ICON: Record<ReputationBadge["id"], React.ReactNode> = {
  "top-rated": <Star size={11} />,
  expert: <Award size={11} />,
  rising: <TrendingUp size={11} />,
  verified: <BadgeCheck size={11} />,
  new: <Zap size={11} />,
  "payment-verified": <CreditCard size={11} />,
  "plus-client": <Crown size={11} />,
  "repeat-client": <Repeat size={11} />,
};

export function ReputationBadges({
  badges,
  size = "sm",
}: {
  badges: ReputationBadge[];
  size?: "sm" | "md";
}) {
  if (!badges.length) return null;
  return (
    <div className={clsx("rep-badges", size)}>
      {badges.map((badge) => (
        <span
          key={badge.id}
          className={clsx("rep-badge", `tone-${badge.tone}`)}
          title={badge.description}
        >
          {BADGE_ICON[badge.id]}
          {badge.label}
        </span>
      ))}
    </div>
  );
}

export function ProfileReputationBadges({
  profile,
  size,
}: {
  profile: Profile;
  size?: "sm" | "md";
}) {
  return <ReputationBadges badges={profileBadges(profile)} size={size} />;
}

export function AgentReputationBadges({
  agent,
  size,
}: {
  agent: Agent;
  size?: "sm" | "md";
}) {
  return <ReputationBadges badges={agentBadges(agent)} size={size} />;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <span className={clsx("status-badge", status)}>{statusLabels[status]}</span>;
}

export function BudgetAmount({ units }: { units: number }) {
  return <strong>{formatUsdcUnits(units)}</strong>;
}

export function ChainTxLink({ txHash, label }: { txHash?: string; label?: string }) {
  const url = explorerTxUrl(txHash);
  if (!txHash || !url) return <span className="muted small">Not recorded</span>;
  return (
    <a className="badge" href={url} target="_blank" rel="noreferrer">
      <ExternalLink size={13} />
      {label ?? `${txHash.slice(0, 8)}...${txHash.slice(-6)}`}
    </a>
  );
}

export function JobRow({
  job,
  client,
  provider,
  agent,
  saved,
  onToggleSave,
}: {
  job: Job;
  client?: Profile;
  provider?: Profile;
  agent?: Agent;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  return (
    <Link className="job-row" href={`/jobs/${job.id}`}>
      <div>
        <h3 className="job-title">{job.title}</h3>
        <div className="meta-line">
          <span>{job.category}</span>
          <span>{client?.displayName ?? "Unknown client"}</span>
          <span>{job.tags.slice(0, 3).join(" / ")}</span>
        </div>
      </div>
      <div>
        <BudgetAmount units={job.budgetUsdcUnits} />
        <div className="small muted">USDC budget</div>
      </div>
      <JobStatusBadge status={job.status} />
      <div className="profile-strip">
        <span className="avatar">{job.actorType === "agent" ? <Bot size={18} /> : <UserRound size={18} />}</span>
        <div>
          <strong className="small">{agent?.name ?? provider?.displayName ?? "Unassigned"}</strong>
          <div className="small muted">{job.actorType}</div>
          {agent ? (
            <AgentReputationBadges agent={agent} />
          ) : provider ? (
            <ProfileReputationBadges profile={provider} />
          ) : null}
        </div>
      </div>
      <div className="small muted">
        {job.deadlineAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(job.deadlineAt)) : "No deadline"}
      </div>
      {onToggleSave ? (
        <button
          type="button"
          className={clsx("bookmark-button", saved && "active")}
          aria-label={saved ? "Remove from saved" : "Save job"}
          aria-pressed={saved}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleSave();
          }}
        >
          {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      ) : null}
    </Link>
  );
}

const timeline: Array<{ status: JobStatus; label: string; text: string; icon: typeof Circle }> = [
  { status: "open", label: "Open", text: "Listing is accepting applications.", icon: Circle },
  { status: "assigned", label: "Assigned", text: "Provider has been selected.", icon: UserRound },
  { status: "onchain_created", label: "Created", text: "Escrow job is live onchain.", icon: FileCheck2 },
  { status: "budget_set", label: "Budget", text: "Amount agreed for the work.", icon: CreditCard },
  { status: "funded", label: "Funded", text: "USDC is locked in escrow.", icon: Lock },
  { status: "submitted", label: "Submitted", text: "Deliverable is awaiting review.", icon: FileUp },
  { status: "completed", label: "Paid", text: "Payment has been released.", icon: BadgeCheck },
];

/** Non-linear statuses overlay the linear timeline instead of advancing it. */
const overlayStatuses: Partial<Record<JobStatus, { step: JobStatus; label: string; text: string; tone: "warn" | "danger" }>> = {
  draft: { step: "open", label: "Draft", text: "Job is not published yet.", tone: "warn" },
  funding_pending: { step: "budget_set", label: "Awaiting funding", text: "Waiting for the client to lock USDC in escrow.", tone: "warn" },
  revision_requested: { step: "submitted", label: "Revision requested", text: "Client asked for changes before payment.", tone: "warn" },
  rejected: { step: "submitted", label: "Rejected", text: "Deliverable was rejected — penalty applied, client refunded.", tone: "danger" },
  disputed: { step: "submitted", label: "Disputed", text: "A dispute is open — funds frozen until resolved.", tone: "danger" },
  cancelled: { step: "open", label: "Cancelled", text: "Job was cancelled before funding.", tone: "danger" },
  expired: { step: "funded", label: "Expired", text: "Deadline passed — client can reclaim the escrow.", tone: "danger" },
};

export function EscrowTimeline({ status }: { status: JobStatus }) {
  const overlay = overlayStatuses[status];
  const effectiveStatus: JobStatus = overlay ? overlay.step : status;
  const rank = statusRank(effectiveStatus);
  const currentIndex = timeline.findIndex((step) => statusRank(step.status) === rank);
  // Progress fill covers the current step's segment; terminal paid = 100%.
  const progress = effectiveStatus === "completed" ? 100 : Math.max(0, (currentIndex / (timeline.length - 1)) * 100);
  const tone = overlay?.tone ?? (effectiveStatus === "completed" ? "success" : undefined);

  return (
    <div className={clsx("escrow-timeline", tone && `escrow-timeline-${tone}`)}>
      <div className="escrow-track" aria-hidden>
        <div className="escrow-track-fill" style={{ width: `${progress}%` }} />
      </div>
      <ol className="escrow-steps" role="list">
        {timeline.map((step, index) => {
          const done = index < currentIndex || effectiveStatus === "completed";
          const current = index === currentIndex && effectiveStatus !== "completed";
          const upcoming = !done && !current;
          const Icon = step.icon;
          const stepTone =
            overlay && index === currentIndex ? tone : done && effectiveStatus === "completed" ? "success" : undefined;
          return (
            <li
              key={step.status}
              className={clsx(
                "escrow-step",
                done && "done",
                current && "current",
                upcoming && "upcoming",
                stepTone && `escrow-step-${stepTone}`,
              )}
              aria-current={current ? "step" : undefined}
            >
              <span className="escrow-dot">
                {done ? <CheckCircle2 size={15} /> : current ? <Icon size={14} /> : <Circle size={11} />}
              </span>
              <span className="escrow-step-label">{step.label}</span>
              <span className="escrow-step-text">{step.text}</span>
            </li>
          );
        })}
      </ol>
      {overlay ? (
        <div className={clsx("escrow-overlay-note", tone === "danger" ? "escrow-overlay-danger" : "escrow-overlay-warn")} role="status">
          <strong>{overlay.label}</strong>
          <span>{overlay.text}</span>
        </div>
      ) : null}
    </div>
  );
}

export type EscrowStepAction = {
  href: string;
  label: string;
  description: string;
};

export type EscrowStepGuidance = {
  who: "you" | "them" | "system";
  actorRole: "client" | "provider";
  action?: EscrowStepAction;
  note: string;
};

/**
 * Who-moves-next guidance for every lifecycle status, from the viewer's role.
 * Returns null when the status is terminal or nothing is actionable.
 */
export function escrowNextStep(
  status: JobStatus,
  viewerRole: "client" | "provider" | "other",
): EscrowStepGuidance | null {
  const clientAction: Partial<Record<JobStatus, EscrowStepAction>> = {
    open: { href: "#applications", label: "Review applications", description: "Pick a provider below to begin the escrow flow." },
    assigned: { href: "#escrow-panel", label: "Start onchain job", description: "Lock in the provider and create the escrow job on Arc." },
    onchain_created: { href: "#escrow-panel", label: "Set budget", description: "Confirm the USDC amount the provider will receive." },
    budget_set: { href: "/jobs", label: "Fund escrow", description: "Approve and lock USDC so the provider can start." },
    submitted: { href: "#deliverable", label: "Review deliverable", description: "Check the submission, then approve, request revision, or reject." },
    revision_requested: { href: "#deliverable", label: "Await revision", description: "The provider is updating the deliverable based on your feedback." },
  };

  const providerAction: Partial<Record<JobStatus, EscrowStepAction>> = {
    open: { href: "#apply", label: "Submit application", description: "Send your pitch — the client picks one provider." },
    onchain_created: { href: "#escrow-panel", label: "Wait for budget", description: "The client is confirming the budget before funding." },
    budget_set: { href: "#escrow-panel", label: "Wait for funding", description: "Funds are about to be locked — you can start once funded." },
    funded: { href: "#deliverable", label: "Submit deliverable", description: "Escrow is locked — upload your work to unlock payment." },
    submitted: { href: "#deliverable", label: "Await review", description: "The client is reviewing your deliverable." },
    revision_requested: { href: "#deliverable", label: "Revise deliverable", description: "Address the client's feedback and resubmit." },
  };

  if (status === "completed" || status === "cancelled" || status === "expired" || status === "rejected") {
    return null;
  }

  const guidance: Partial<Record<JobStatus, EscrowStepGuidance>> = {
    draft: { who: "them", actorRole: "client", note: "Waiting for the client to publish this job." },
    open: { who: "you", actorRole: viewerRole === "provider" ? "provider" : "client", note: "Waiting for a provider to be selected." },
    assigned: { who: "them", actorRole: "client", note: "Waiting for the client to create the escrow onchain." },
    onchain_created: { who: "them", actorRole: "client", note: "Waiting for the client to set the budget." },
    budget_set: { who: "them", actorRole: "client", note: "Waiting for the client to fund the escrow." },
    funding_pending: { who: "them", actorRole: "client", note: "Waiting for the client to fund the escrow." },
    funded: { who: "you", actorRole: "provider", note: "Escrow is locked — time to deliver." },
    submitted: { who: "them", actorRole: "client", note: "Waiting for the client's review of the deliverable." },
    revision_requested: { who: "them", actorRole: "provider", note: "Waiting for the provider to resubmit." },
    disputed: { who: "system", actorRole: "client", note: "Dispute open — funds are frozen until an admin resolves it." },
  };

  const step = guidance[status];
  if (!step) return null;

  // "Your move" when the actorRole matches the viewer; the apply panel already
  // serves open jobs for providers, so only clients get a CTA there.
  const actorIsViewer =
    (step.actorRole === "client" && viewerRole === "client") ||
    (step.actorRole === "provider" && viewerRole === "provider");
  const action = actorIsViewer
    ? step.actorRole === "client"
      ? clientAction[status]
      : providerAction[status]
    : undefined;
  const who: EscrowStepGuidance["who"] = step.who === "system" ? "system" : actorIsViewer ? "you" : "them";
  return { who, actorRole: step.actorRole, action, note: action ? action.description : step.note };
}

/**
 * "What happens next" card under the escrow timeline: tells the viewer whose
 * move it is and, when it is theirs, links straight to the action.
 */
export function EscrowNextStep({
  status,
  viewerRole,
}: {
  status: JobStatus;
  viewerRole: "client" | "provider" | "other";
}) {
  const guidance = escrowNextStep(status, viewerRole);
  if (!guidance) return null;

  const isYou = guidance.who === "you";
  const isSystem = guidance.who === "system";
  return (
    <div className={clsx("escrow-next-step", isYou && "escrow-next-you", isSystem && "escrow-next-system")}>
      <div className="escrow-next-copy">
        <span className="escrow-next-who">
          {isYou ? (
            <>
              <Zap size={12} /> Your move
            </>
          ) : isSystem ? (
            <>
              <Clock3 size={12} /> On hold
            </>
          ) : (
            <>
              <Clock3 size={12} /> Waiting
            </>
          )}
        </span>
        <p className="escrow-next-note">{guidance.note}</p>
      </div>
      {isYou && guidance.action ? (
        <Link className="button primary small" href={guidance.action.href}>
          {guidance.action.label}
          <ExternalLink size={13} />
        </Link>
      ) : null}
    </div>
  );
}

export function DeliverableViewer({
  jobId,
  submissionId,
  mime,
  fileName,
  sizeBytes,
  sha256,
  isApproved,
  isProvider,
  externalUrl,
  notes,
  hash,
  hasUploadedFile,
}: {
  jobId?: string;
  submissionId?: string;
  mime?: string;
  fileName?: string;
  sizeBytes?: number;
  sha256?: string;
  isApproved?: boolean;
  isProvider?: boolean;
  externalUrl?: string;
  notes?: string;
  hash?: string;
  hasUploadedFile?: boolean;
}) {
  const hasFile = Boolean(jobId && submissionId && hasUploadedFile && (mime || fileName));
  const isImage = (mime ?? "").startsWith("image/");
  const canSeeFull = Boolean(isApproved || isProvider);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | undefined>();

  if (!hasFile && !externalUrl && !notes) {
    return <div className="empty">No deliverable submitted yet.</div>;
  }

  async function download() {
    if (!jobId || !submissionId) return;
    setDownloadError(undefined);
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/jobs/${jobId}/deliverable?submissionId=${submissionId}&mode=download`,
      );
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Download not available.");
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  const sizeLabel = typeof sizeBytes === "number" ? `${(sizeBytes / 1024).toFixed(0)} KB` : undefined;

  return (
    <div className="grid">
      <div className="profile-strip">
        <span className="avatar">
          {canSeeFull ? <FileCheck2 size={18} /> : <Lock size={18} />}
        </span>
        <div>
          <strong>{hasFile ? fileName ?? "Uploaded deliverable" : "Submitted deliverable"}</strong>
          <div className="small muted">
            {!hasFile
              ? "Open the link to review the work."
              : canSeeFull
                ? "Approved — you can download the original file."
                : "Locked preview — approve the work to download the original."}
          </div>
        </div>
      </div>

      {hasFile ? (
        <>
          {isImage ? (
            <img
              src={`/api/jobs/${jobId}/deliverable?submissionId=${submissionId}&mode=preview`}
              alt={canSeeFull ? "Deliverable" : "Watermarked preview"}
              style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border, #2222)" }}
            />
          ) : (
            <div className="copy-box" style={{ display: "grid", gap: 4 }}>
              <span><strong>File:</strong> {fileName ?? "deliverable"}</span>
              {sizeLabel ? <span><strong>Size:</strong> {sizeLabel}</span> : null}
              {mime ? <span><strong>Type:</strong> {mime}</span> : null}
              {sha256 ? <span className="small muted">sha256: {sha256.slice(0, 24)}…</span> : null}
              {!canSeeFull ? (
                <span className="small muted">Contents are locked until you approve the work.</span>
              ) : null}
            </div>
          )}

          {canSeeFull ? (
            <button className="button primary" type="button" onClick={download} disabled={downloading}>
              <Download size={16} />
              {downloading ? "Preparing…" : "Download original"}
            </button>
          ) : (
            <div className="badge" style={{ width: "fit-content" }}>
              <Lock size={13} />
              Locked until approved
            </div>
          )}
          {downloadError ? (
            <p className="small" style={{ color: "var(--danger)" }}>{downloadError}</p>
          ) : null}
        </>
      ) : null}

      {externalUrl ? (
        <div style={{ display: "grid", gap: 4 }}>
          <a className="button ghost" href={externalUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Open external link
          </a>
          <span className="small muted">External link — outside platform protection.</span>
        </div>
      ) : null}

      {notes ? <p className="muted">{notes}</p> : null}
      {hash ? <div className="copy-box">{hash}</div> : null}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="stars" aria-label={`${clamped} out of 5`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={idx}
          size={13}
          className={idx < clamped ? "star-on" : "star-off"}
          fill={idx < clamped ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export function ReviewsPanel({
  reviews,
  getReviewer,
  getJob,
}: {
  reviews: JobReview[];
  getReviewer: (id: string) => Profile | undefined;
  getJob?: (jobId: string) => Job | undefined;
}) {
  if (reviews.length === 0) {
    return (
      <div className="empty empty-rich" role="status">
        <strong className="empty-title">No reviews yet</strong>
        <span className="empty-desc">Reviews land here after a job completes on-chain.</span>
      </div>
    );
  }

  const sorted = reviews
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ul className="reviews-list">
      {sorted.map((review) => {
        const reviewer = getReviewer(review.reviewerProfileId);
        const job = getJob?.(review.jobId);
        return (
          <li key={review.id} className="review-item">
            <div className="review-head">
              <Stars rating={review.rating} />
              <span className="small muted">
                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
                  new Date(review.createdAt),
                )}
              </span>
            </div>
            {review.reviewText ? <p className="review-text">{review.reviewText}</p> : null}
            <div className="review-meta small muted">
              <span>{reviewer?.displayName ?? "Anonymous client"}</span>
              {job ? (
                <Link className="review-job-link" href={`/jobs/${job.id}`}>
                  {job.title}
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
