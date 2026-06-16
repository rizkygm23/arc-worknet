"use client";

import { ArrowLeft, CheckCircle2, Gavel, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, SkeletonPanel } from "@/components/app-shell";
import { ChainTxLink, DeliverableViewer, JobStatusBadge } from "@/components/job-components";
import { formatUsdcUnits } from "@/lib/money";
import { useWorkNet } from "@/lib/store";
import type { Job } from "@/lib/types";

export default function ReviewJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    activeProfile,
    completeJob,
    getJob,
    getJobEvaluation,
    getJobSubmissions,
    rejectSubmission,
    requestRevision,
    resolveDispute,
    isContractOwner,
    isSyncing,
  } = useWorkNet();
  const job = getJob(params.id);
  const submission = getJobSubmissions(params.id)[0];
  const evaluation = getJobEvaluation(submission?.id);
  const [reviewText, setReviewText] = useState("Approved. Deliverable meets the acceptance criteria.");
  const [rating, setRating] = useState(5);
  const [busyAction, setBusyAction] = useState<string | undefined>();
  const [providerAmount, setProviderAmount] = useState(0);
  const [resolveReason, setResolveReason] = useState("Dispute resolved by escrow owner.");
  const [resolveError, setResolveError] = useState<string | undefined>();

  if (!job) {
    if (isSyncing) return <SkeletonPanel lines={5} />;
    notFound();
  }
  const currentJob = job as Job;
  const canReview = activeProfile?.id === currentJob.clientProfileId && currentJob.status === "submitted";
  const isDisputed = currentJob.status === "disputed";
  const canResolve = isDisputed && isContractOwner;

  async function approve() {
    if (!submission || !canReview) return;
    setBusyAction("approve");
    await completeJob(currentJob.id, submission.id, { rating, reviewText });
    router.push(`/jobs/${currentJob.id}`);
  }

  async function revise() {
    if (!submission || !canReview) return;
    setBusyAction("revision");
    await requestRevision(currentJob.id, submission.id, reviewText);
    router.push(`/jobs/${currentJob.id}`);
  }

  async function reject() {
    if (!submission || !canReview) return;
    setBusyAction("reject");
    await rejectSubmission(currentJob.id, submission.id, reviewText);
    router.push(`/jobs/${currentJob.id}`);
  }

  async function resolve() {
    if (!canResolve) return;
    setResolveError(undefined);
    setBusyAction("resolve");
    try {
      await resolveDispute(currentJob.id, providerAmount, resolveReason);
      router.push(`/jobs/${currentJob.id}`);
    } catch (error) {
      setResolveError(error instanceof Error ? error.message : "Failed to resolve dispute.");
      setBusyAction(undefined);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Review"
        title={currentJob.title}
        subtitle="Approve to pay the worker, ask for changes, or reject. Rejecting still pays the worker a 5% fee and refunds you 95% — automatically, with no third party."
        actions={
          <Link className="button ghost" href={`/jobs/${currentJob.id}`}>
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      <section className="layout-with-rail">
        <div className="grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Submission</h2>
                <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                  Confirm the deliverable before releasing escrow.
                </p>
              </div>
              <JobStatusBadge status={currentJob.status} />
            </div>
            <DeliverableViewer
              jobId={currentJob.id}
              submissionId={submission?.id}
              mime={submission?.deliverableMimeType}
              fileName={submission?.deliverableFileName}
              sizeBytes={submission?.deliverableSizeBytes}
              sha256={submission?.deliverableSha256}
              isApproved={submission?.status === "approved" || currentJob.status === "completed"}
              isProvider={false}
              externalUrl={submission?.deliverableUrl}
              notes={submission?.notes}
              hash={submission?.deliverableHashBytes32}
            />
          </div>

          <div className="panel">
            <div className="form-grid">
              <label className="field">
                <span>Rating</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                />
              </label>
              <label className="field span-2">
                <span>Review / reason</span>
                <textarea
                  className="textarea"
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                />
              </label>
            </div>

            {isDisputed ? (
              <div className="panel" style={{ marginTop: 16, borderColor: "var(--warn, #b45309)" }}>
                <div className="profile-strip">
                  <span className="avatar">
                    <Gavel size={18} />
                  </span>
                  <div>
                    <h2 className="panel-title">Decide the dispute</h2>
                    <p className="small muted" style={{ margin: "4px 0 0" }}>
                      {canResolve
                        ? "Choose how much of the escrowed USDC goes to the worker. The rest is refunded to the client. Enter 0 to refund the client in full."
                        : "This job is on hold. Only the neutral arbitrator can decide how the funds are split."}
                    </p>
                  </div>
                </div>
                {canResolve ? (
                  <>
                    <div className="form-grid" style={{ marginTop: 12 }}>
                      <label className="field">
                        <span>Pay the worker (USDC units)</span>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          max={currentJob.budgetUsdcUnits}
                          value={providerAmount}
                          onChange={(event) => setProviderAmount(Number(event.target.value))}
                        />
                        <span className="small muted">
                          Worker gets {formatUsdcUnits(providerAmount)} · client refunded{" "}
                          {formatUsdcUnits(Math.max(currentJob.budgetUsdcUnits - providerAmount, 0))}
                        </span>
                      </label>
                      <label className="field span-2">
                        <span>Note your decision</span>
                        <textarea
                          className="textarea"
                          value={resolveReason}
                          onChange={(event) => setResolveReason(event.target.value)}
                        />
                      </label>
                    </div>
                    {resolveError ? (
                      <p className="small" style={{ color: "var(--warn, #b45309)", marginTop: 8 }}>
                        {resolveError}
                      </p>
                    ) : null}
                    <div className="actions" style={{ marginTop: 12 }}>
                      <button
                        className="button primary"
                        type="button"
                        disabled={Boolean(busyAction)}
                        onClick={resolve}
                      >
                        <Gavel size={16} />
                        {busyAction === "resolve" ? "Saving decision…" : "Confirm decision"}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : canReview ? (
              <div className="actions" style={{ marginTop: 16, flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="button primary" type="button" disabled={!submission || Boolean(busyAction)} onClick={approve}>
                    <CheckCircle2 size={16} />
                    Approve &amp; pay worker
                  </button>
                  <button className="button" type="button" disabled={!submission || Boolean(busyAction)} onClick={revise}>
                    <RotateCcw size={16} />
                    Ask for changes
                  </button>
                  <button className="button" type="button" disabled={!submission || Boolean(busyAction)} onClick={reject}>
                    <XCircle size={16} />
                    Reject (pay 5% to worker)
                  </button>
                </div>
                <p className="small muted" style={{ marginTop: 10 }}>
                  Rejecting still pays the worker a <strong>5% fee</strong> (
                  {formatUsdcUnits(Math.floor(currentJob.budgetUsdcUnits * 0.05))}). You are refunded{" "}
                  <strong>95%</strong> (
                  {formatUsdcUnits(currentJob.budgetUsdcUnits - Math.floor(currentJob.budgetUsdcUnits * 0.05))}
                  ). This is automatic on-chain — no admin or third party is involved.
                </p>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 16 }}>
                Only the client wallet can review submitted work and release or dispute escrow.
              </p>
            )}
          </div>
        </div>

        <aside className="grid">
          <div className="panel">
            <h2 className="panel-title">AI evaluation draft</h2>
            {evaluation ? (
              <>
                <div className="stat" style={{ marginTop: 14 }}>
                  <span>Score</span>
                  <strong>{evaluation.score}/100</strong>
                </div>
                <p className="muted">{evaluation.summary}</p>
                <div className="tags">
                  <span className="tag">{evaluation.verdict}</span>
                  <span className="tag">{evaluation.model}</span>
                </div>
              </>
            ) : (
              <p className="muted">No AI evaluation is available yet.</p>
            )}
          </div>

          <div className="panel">
            <h2 className="panel-title">Settlement tx</h2>
            <p className="small muted hide-mobile">Final payment release transaction.</p>
            {currentJob.completeTxHash ? (
              <ChainTxLink txHash={currentJob.completeTxHash} />
            ) : (
              <p className="small muted" style={{ marginTop: 8 }}>
                Pending — appears here after escrow is released.
              </p>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}
