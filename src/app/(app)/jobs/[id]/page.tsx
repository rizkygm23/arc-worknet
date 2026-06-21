"use client";

import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  ExternalLink,
  FileUp,
  Handshake,
  MessageSquare,
  Plus,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, SkeletonPanel, WalletPill } from "@/components/app-shell";
import {
  BudgetAmount,
  ChainTxLink,
  DeliverableViewer,
  EscrowTimeline,
  JobStatusBadge,
} from "@/components/job-components";
import { useApplicationOverlay } from "@/lib/application-overlay";
import { useJobMessages } from "@/lib/job-messages";
import { nextOnchainAction, useWorkNet } from "@/lib/store";
import type { Job, Profile } from "@/lib/types";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return "just now";
  if (abs < 3600) return `${Math.round(abs / 60)}m ago`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h ago`;
  if (abs < 86400 * 7) return `${Math.round(abs / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function MessagesPanel({ job }: { job: Job }) {
  const { activeProfile, getProfile } = useWorkNet();
  const { messages, postMessage, hydrated } = useJobMessages(job.id);
  const [draft, setDraft] = useState("");

  const isParticipant =
    activeProfile?.id === job.clientProfileId || activeProfile?.id === job.providerProfileId;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProfile) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    postMessage(activeProfile.id, trimmed);
    setDraft("");
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="profile-strip">
          <span className="avatar">
            <MessageSquare size={18} />
          </span>
          <div>
            <h2 className="panel-title">Messages</h2>
            <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
              Direct thread between client and provider.
            </p>
          </div>
        </div>
        <span className="small muted">{messages.length} message{messages.length === 1 ? "" : "s"}</span>
      </div>

      {!hydrated ? (
        <div className="empty">Loading thread…</div>
      ) : messages.length === 0 ? (
        <div className="empty">No messages yet. Start the conversation below.</div>
      ) : (
        <ul className="messages-list">
          {messages.map((message) => {
            const author = getProfile(message.authorProfileId);
            const isMe = author?.id === activeProfile?.id;
            return (
              <li key={message.id} className={`message-item${isMe ? " message-mine" : ""}`}>
                <span className="message-avatar" aria-hidden>
                  {(author?.displayName ?? "?").slice(0, 1)}
                </span>
                <div className="message-body">
                  <div className="message-meta">
                    <strong>{author?.displayName ?? "Unknown"}</strong>
                    <span className="small muted">{relativeTime(message.createdAt)}</span>
                  </div>
                  <p className="message-text">{message.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {activeProfile && isParticipant ? (
        <form onSubmit={handleSubmit} className="message-compose">
          <textarea
            className="textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message…"
            aria-label="Message body"
            rows={2}
          />
          <button className="button primary" type="submit" disabled={!draft.trim()}>
            <Send size={14} />
            Send
          </button>
        </form>
      ) : (
        <p className="small muted" style={{ marginTop: 12 }}>
          Only the client and assigned provider can post in this thread.
        </p>
      )}
    </div>
  );
}

function DeclineApplicationButton({
  applicationId,
  applicantName,
  onDecline,
  disabled,
}: {
  applicationId: string;
  applicantName: string;
  onDecline: (id: string, reason: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        className="button ghost small"
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <X size={14} />
        Decline
      </button>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
      <label className="field" style={{ margin: 0 }}>
        <span className="small muted">Reason (optional, shared with {applicantName})</span>
        <textarea
          className="textarea"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          placeholder="Scope changed, going with another fit, etc."
          aria-label="Decline reason"
        />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="button"
          type="button"
          onClick={() => {
            onDecline(applicationId, reason);
            setOpen(false);
            setReason("");
          }}
          disabled={disabled}
        >
          Confirm decline
        </button>
        <button
          className="button ghost"
          type="button"
          onClick={() => {
            setOpen(false);
            setReason("");
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ApplicantCard({
  application,
  applicantProfile,
  applicantAgent,
  applicantOwnerProfile,
  effectiveStatus,
  declineReason,
  onAccept,
  onDecline,
  busy,
}: {
  application: { id: string; pitch: string; actorType: string; status: string };
  applicantProfile?: Profile;
  applicantAgent?: { name: string; ownerProfileId: string } | undefined;
  applicantOwnerProfile?: Profile;
  effectiveStatus: string;
  declineReason?: string;
  onAccept: (id: string) => void;
  onDecline: (id: string, reason: string) => void;
  busy: boolean;
}) {
  const displayName =
    application.actorType === "agent"
      ? applicantAgent?.name ?? "Agent"
      : applicantProfile?.displayName ?? "Worker";
  const subline =
    application.actorType === "agent"
      ? `Agent · owner ${applicantOwnerProfile?.displayName ?? "?"} · ${effectiveStatus}`
      : effectiveStatus;

  return (
    <div className="card panel">
      <div className="panel-header">
        <div className="profile-strip">
          <span className="avatar">{displayName.slice(0, 1)}</span>
          <div>
            <strong>{displayName}</strong>
            <div className="small muted">{subline}</div>
          </div>
        </div>
        {effectiveStatus === "pending" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="button primary"
              type="button"
              onClick={() => onAccept(application.id)}
              disabled={busy}
            >
              <Check size={16} />
              Accept
            </button>
            <DeclineApplicationButton
              applicationId={application.id}
              applicantName={displayName}
              onDecline={onDecline}
              disabled={busy}
            />
          </div>
        ) : null}
      </div>
      <p className="muted">{application.pitch}</p>
      {effectiveStatus === "rejected" && declineReason ? (
        <p className="small muted" style={{ marginTop: 4 }}>
          <strong>Decline reason:</strong> {declineReason}
        </p>
      ) : null}
    </div>
  );
}

function TransactionsPanel({ job }: { job: Job }) {
  const entries: Array<[string, string | undefined]> = [
    ["Job created", job.createTxHash],
    ["Budget set", job.setBudgetTxHash],
    ["Approved USDC", job.approveTxHash],
    ["Escrow funded", job.fundTxHash],
    ["Deliverable submitted", job.submitTxHash],
    ["Payment released", job.completeTxHash],
  ];
  const completed = entries.filter(([, hash]) => Boolean(hash));
  const latest = completed.slice(-3).reverse();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? completed.slice().reverse() : latest;

  if (completed.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Activity</h2>
        {completed.length > latest.length ? (
          <button className="button ghost small" type="button" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show latest" : `Show all (${completed.length})`}
          </button>
        ) : null}
      </div>
      <div className="activity-list" style={{ marginTop: 12 }}>
        {visible.map(([label, txHash]) => (
          <div className="activity-item" key={label}>
            <span className="activity-icon">
              <ExternalLink size={15} />
            </span>
            <span>
              <strong>{label}</strong>
              <span style={{ display: "block", marginTop: 6 }}>
                <ChainTxLink txHash={txHash} />
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextStepAction({ job }: { job: Job }) {
  const { activeProfile, createOnchainJob, setBudget, approveAndFund } = useWorkNet();
  const action = nextOnchainAction(job.status);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function runAction(handler: () => Promise<void>) {
    setIsBusy(true);
    setError(undefined);
    try {
      await handler();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
    } finally {
      setIsBusy(false);
    }
  }

  if (activeProfile?.id !== job.clientProfileId) return null;
  if (!action) return null;

  const copy = {
    createJob: {
      label: "Start job",
      text: "Lock in the assigned provider and begin the escrow flow.",
      icon: <Handshake size={16} />,
      onClick: () => runAction(() => createOnchainJob(job.id)),
    },
    setBudget: {
      label: "Set budget",
      text: "Confirm the USDC budget for this job.",
      icon: <CircleDollarSign size={16} />,
      onClick: () => runAction(() => setBudget(job.id)),
    },
    fund: {
      label: "Fund escrow",
      text: "Approve and lock USDC into escrow until the work is delivered.",
      icon: <Check size={16} />,
      onClick: () => runAction(() => approveAndFund(job.id)),
    },
  }[action];

  return (
    <div style={{ marginTop: 16, borderTop: "var(--rule-thin) solid var(--hairline)", paddingTop: 16 }}>
      <p className="small muted" style={{ margin: "0 0 8px" }}>Next step</p>
      <p className="muted" style={{ margin: "0 0 12px" }}>{copy.text}</p>
      {error ? <p className="small" style={{ color: "var(--danger)", margin: "0 0 8px" }}>{error}</p> : null}
      <button className="button primary" type="button" onClick={copy.onClick} disabled={isBusy}>
        {copy.icon}
        {copy.label}
      </button>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    activeProfile,
    applyToJob,
    acceptApplication,
    getAgent,
    getJob,
    getJobApplications,
    getJobEvaluation,
    getJobSubmissions,
    getProfile,
    isSyncing,
    state,
  } = useWorkNet();
  const [pitch, setPitch] = useState("I can deliver this with a reproducible checklist and concise handoff notes.");
  const [applyAs, setApplyAs] = useState<string>("");
  const [actionError, setActionError] = useState<string | undefined>();
  const [busyAction, setBusyAction] = useState<string | undefined>();
  const { decline, getEffectiveStatus, getDeclineReason } = useApplicationOverlay();
  const job = getJob(params.id);

  if (!job) {
    if (isSyncing) return <SkeletonPanel lines={6} />;
    notFound();
  }

  const currentJob = job as Job;
  const client = getProfile(currentJob.clientProfileId);
  const provider = getProfile(currentJob.providerProfileId);
  const agent = getAgent(currentJob.providerAgentId);
  const applications = getJobApplications(currentJob.id);
  const submissions = getJobSubmissions(currentJob.id);
  const latestSubmission = submissions[0];
  const evaluation = getJobEvaluation(latestSubmission?.id);
  const myAgents = activeProfile
    ? state.agents.filter((a) => a.ownerProfileId === activeProfile.id)
    : [];
  const isClient = activeProfile?.id === currentJob.clientProfileId;
  const isOwnerOfProviderAgent = Boolean(
    currentJob.providerAgentId && agent?.ownerProfileId === activeProfile?.id,
  );
  const isProvider = activeProfile?.id === currentJob.providerProfileId || isOwnerOfProviderAgent;
  const canSubmit =
    isProvider && ["funded", "submitted", "revision_requested"].includes(currentJob.status);

  const ownApplication = activeProfile
    ? applications.find(
        (application) =>
          application.applicantProfileId === activeProfile.id ||
          myAgents.some((a) => a.id === application.applicantAgentId),
      )
    : undefined;
  const canApply = !isClient && currentJob.status === "open";

  async function apply() {
    setBusyAction("apply");
    setActionError(undefined);
    try {
      await applyToJob(currentJob.id, pitch, applyAs || undefined);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not apply.");
    } finally {
      setBusyAction(undefined);
    }
  }

  async function accept(applicationId: string) {
    setBusyAction(applicationId);
    setActionError(undefined);
    try {
      await acceptApplication(applicationId);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not accept application.");
    } finally {
      setBusyAction(undefined);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={currentJob.category}
        title={currentJob.title}
        subtitle={currentJob.brief}
        actions={
          <>
            <WalletPill />
            <Link className="button ghost" href="/jobs">
              <ArrowLeft size={16} />
              Back
            </Link>
            {canSubmit ? (
              <Link className="button primary" href={`/jobs/${currentJob.id}/submit`}>
                <FileUp size={16} />
                Submit
              </Link>
            ) : null}
            {isClient && currentJob.status === "submitted" ? (
              <Link className="button primary" href={`/jobs/${currentJob.id}/review`}>
                <Check size={16} />
                Review
              </Link>
            ) : null}
          </>
        }
      />

      <section className="layout-with-rail">
        <div className="grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Work brief</h2>
                <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                  Required output: {currentJob.deliverableFormat}
                </p>
              </div>
              <JobStatusBadge status={currentJob.status} />
            </div>
            <h3 className="section-title">Acceptance criteria</h3>
            <p className="muted" style={{ lineHeight: 1.6 }}>
              {currentJob.acceptanceCriteria}
            </p>
            <div className="tags">
              {currentJob.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {canApply ? (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Apply to this job</h2>
                  <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                    {ownApplication
                      ? `Your application is ${ownApplication.status}. Submit again to update your pitch.`
                      : "Send your pitch — the client will choose a provider."}
                  </p>
                </div>
              </div>
              <label className="field" style={{ marginBottom: 12 }}>
                <span>Apply as</span>
                <select
                  className="select"
                  value={applyAs}
                  onChange={(event) => setApplyAs(event.target.value)}
                  aria-label="Apply as"
                >
                  <option value="">Myself ({activeProfile?.displayName})</option>
                  {myAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      Agent: {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                className="textarea"
                value={pitch}
                onChange={(event) => setPitch(event.target.value)}
                aria-label="Application pitch"
              />
              {actionError ? <p className="small" style={{ color: "var(--danger)" }}>{actionError}</p> : null}
              <button className="button primary" type="button" onClick={apply} disabled={Boolean(busyAction)} style={{ marginTop: 12 }}>
                <Send size={16} />
                {ownApplication ? "Update application" : "Apply"}
              </button>
            </div>
          ) : null}

          {isClient && applications.length > 0 ? (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Applications</h2>
                  <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                    Choose one provider to start the job.
                  </p>
                </div>
              </div>
              <div className="grid">
                {applications.map((application) => {
                  const applicantProfile = getProfile(application.applicantProfileId);
                  const applicantAgent = getAgent(application.applicantAgentId);
                  const applicantOwnerProfile = getProfile(applicantAgent?.ownerProfileId);
                  const effectiveStatus = getEffectiveStatus(application.id, application.status);
                  const declineReason = getDeclineReason(application.id);
                  return (
                    <ApplicantCard
                      key={application.id}
                      application={application}
                      applicantProfile={applicantProfile}
                      applicantAgent={applicantAgent}
                      applicantOwnerProfile={applicantOwnerProfile}
                      effectiveStatus={effectiveStatus}
                      declineReason={declineReason}
                      onAccept={accept}
                      onDecline={decline}
                      busy={Boolean(busyAction)}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          <MessagesPanel job={currentJob} />

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Deliverable</h2>
                <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                  Provider uploads deliverable; the client reviews and releases payment.
                </p>
              </div>
            </div>
            <DeliverableViewer
              jobId={currentJob.id}
              submissionId={latestSubmission?.id}
              mime={latestSubmission?.deliverableMimeType}
              fileName={latestSubmission?.deliverableFileName}
              sizeBytes={latestSubmission?.deliverableSizeBytes}
              sha256={latestSubmission?.deliverableSha256}
              isApproved={latestSubmission?.status === "approved" || currentJob.status === "completed"}
              isProvider={isProvider}
              externalUrl={latestSubmission?.deliverableUrl}
              notes={latestSubmission?.notes}
              hash={latestSubmission?.deliverableHashBytes32}
            />
            {evaluation ? (
              <div className="panel" style={{ marginTop: 14, boxShadow: "none" }}>
                <div className="panel-header">
                  <h3 className="panel-title">AI evaluation draft</h3>
                  <span className="badge submitted">{evaluation.score}/100</span>
                </div>
                <p className="muted">{evaluation.summary}</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Escrow</h2>
                <p className="small muted" style={{ margin: "4px 0 0" }}>
                  <BudgetAmount units={currentJob.budgetUsdcUnits} />
                </p>
              </div>
              <JobStatusBadge status={currentJob.status} />
            </div>
            <EscrowTimeline status={currentJob.status} />
            <NextStepAction job={currentJob} />
            <div style={{ marginTop: 16, borderTop: "var(--rule-thin) solid var(--hairline)", paddingTop: 16 }}>
              <p className="small muted" style={{ margin: "0 0 10px" }}>Participants</p>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-icon">C</span>
                  <span>
                    <strong>{client?.displayName}</strong>
                    <span className="small muted" style={{ display: "block" }}>
                      Client / evaluator
                    </span>
                  </span>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">{agent ? "A" : "P"}</span>
                  <span>
                    <strong>{agent?.name ?? provider?.displayName ?? "Unassigned"}</strong>
                    <span className="small muted" style={{ display: "block" }}>
                      {currentJob.actorType === "agent" ? "AI agent" : "Human provider"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <TransactionsPanel job={currentJob} />

          {currentJob.status === "open" ? (
            <Link className="button primary" href="/jobs/new">
              <Plus size={16} />
              Create similar job
            </Link>
          ) : null}
        </aside>
      </section>
    </>
  );
}
