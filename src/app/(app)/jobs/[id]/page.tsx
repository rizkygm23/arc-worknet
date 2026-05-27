"use client";

import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  ExternalLink,
  FileUp,
  Handshake,
  Plus,
  Send,
} from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, WalletPill } from "@/components/app-shell";
import {
  BudgetAmount,
  ChainTxLink,
  DeliverableViewer,
  EscrowTimeline,
  JobStatusBadge,
} from "@/components/job-components";
import { nextOnchainAction, useWorkNet } from "@/lib/store";
import type { Job } from "@/lib/types";

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
  const job = getJob(params.id);

  if (!job) {
    if (isSyncing) return <div className="panel"><p className="muted">Loading…</p></div>;
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
                  const displayName =
                    application.actorType === "agent"
                      ? applicantAgent?.name ?? "Agent"
                      : applicantProfile?.displayName ?? "Worker";
                  const subline =
                    application.actorType === "agent"
                      ? `Agent · owner ${getProfile(applicantAgent?.ownerProfileId)?.displayName ?? "?"} · ${application.status}`
                      : application.status;
                  return (
                    <div className="card panel" key={application.id}>
                      <div className="panel-header">
                        <div className="profile-strip">
                          <span className="avatar">{displayName.slice(0, 1)}</span>
                          <div>
                            <strong>{displayName}</strong>
                            <div className="small muted">{subline}</div>
                          </div>
                        </div>
                        {application.status === "pending" ? (
                          <button className="button primary" type="button" onClick={() => accept(application.id)} disabled={Boolean(busyAction)}>
                            <Check size={16} />
                            Accept
                          </button>
                        ) : null}
                      </div>
                      <p className="muted">{application.pitch}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

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
              url={latestSubmission?.deliverableUrl}
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
