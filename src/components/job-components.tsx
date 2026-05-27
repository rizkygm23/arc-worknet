"use client";

import clsx from "clsx";
import {
  Bot,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  FileCheck2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { explorerTxUrl } from "@/lib/arc";
import { formatUsdcUnits } from "@/lib/money";
import { statusLabels, statusRank } from "@/lib/status";
import type { Agent, Job, JobStatus, Profile } from "@/lib/types";

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
}: {
  job: Job;
  client?: Profile;
  provider?: Profile;
  agent?: Agent;
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
        </div>
      </div>
      <div className="small muted">
        {job.deadlineAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(job.deadlineAt)) : "No deadline"}
      </div>
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
  url,
  notes,
  hash,
}: {
  url?: string;
  notes?: string;
  hash?: string;
}) {
  if (!url && !notes) {
    return <div className="empty">No deliverable submitted yet.</div>;
  }

  return (
    <div className="grid">
      <div className="profile-strip">
        <span className="avatar">
          <FileCheck2 size={18} />
        </span>
        <div>
          <strong>Submitted deliverable</strong>
          <div className="small muted">Open the link to review the work.</div>
        </div>
      </div>
      {url ? (
        <a className="button ghost" href={url} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open deliverable
        </a>
      ) : null}
      {notes ? <p className="muted">{notes}</p> : null}
      {hash ? <div className="copy-box">{hash}</div> : null}
    </div>
  );
}
