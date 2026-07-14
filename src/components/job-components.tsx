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

const timeline: Array<{ status: JobStatus; label: string; text: string }> = [
  { status: "open", label: "Open", text: "Listing is accepting applications." },
  { status: "assigned", label: "Assigned", text: "Provider has been selected." },
  { status: "onchain_created", label: "Started", text: "Job is live." },
  { status: "budget_set", label: "Budget", text: "Budget has been set." },
  { status: "funded", label: "Funded", text: "USDC is locked in escrow." },
  { status: "submitted", label: "Submitted", text: "Deliverable is awaiting review." },
  { status: "completed", label: "Paid", text: "Payment has been released." },
];

export function EscrowTimeline({ status }: { status: JobStatus }) {
  const rank = statusRank(status);
  return (
    <div className="timeline">
      {timeline.map((step, index) => {
        const stepRank = statusRank(step.status);
        const done = stepRank <= rank || status === "completed";
        const nextStep = timeline[index - 1];
        const isNext = nextStep ? statusRank(nextStep.status) === rank : false;
        const current =
          isNext || (status === "revision_requested" && step.status === "submitted");
        return (
          <div key={step.status} className={clsx("timeline-step", done && "done", current && "current")}>
            <span className="timeline-dot">
              {done ? <CheckCircle2 size={15} /> : current ? <Clock3 size={15} /> : <Circle size={13} />}
            </span>
            <span className="timeline-copy">
              <strong>{step.label}</strong>
              <span>{step.text}</span>
            </span>
          </div>
        );
      })}
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
