"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Eye,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, SkeletonPanel } from "@/components/app-shell";
import { ChainTxLink, DeliverableViewer, JobStatusBadge } from "@/components/job-components";
import { formatUsdcUnits } from "@/lib/money";
import { useWorkNetActions, useWorkNetData, useWorkNetWallet } from "@/lib/store";
import type { Job } from "@/lib/types";

type CriterionItem = {
  criterion: string;
  status: "met" | "partial" | "unmet";
  comment: string;
};

export default function ReviewJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { activeProfile, getJob, getJobEvaluation, getJobSubmissions, isSyncing } = useWorkNetData();
  const { completeJob, evaluateSubmission, rejectSubmission, requestRevision } = useWorkNetActions();
  const { wallet } = useWorkNetWallet();
  const job = getJob(params.id);
  const submission = getJobSubmissions(params.id)[0];
  const evaluation = getJobEvaluation(submission?.id);
  const [reviewText, setReviewText] = useState("Approved. Deliverable meets the acceptance criteria.");
  const [rating, setRating] = useState(5);
  const [busyAction, setBusyAction] = useState<string | undefined>();
  const [isEvaluating, setIsEvaluating] = useState(false);

  if (!job) {
    if (isSyncing) return <SkeletonPanel lines={5} />;
    notFound();
  }
  const currentJob = job as Job;
  const canReview = activeProfile?.id === currentJob.clientProfileId && currentJob.status === "submitted";

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

  async function handleRunAiEvaluation() {
    if (!submission) return;
    try {
      setIsEvaluating(true);
      await evaluateSubmission(currentJob.id, submission.id);
    } catch (err) {
      console.error("AI evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  }

  const rubricAssessments = (evaluation?.rubric?.criteriaAssessment as CriterionItem[] | undefined) || [];
  const rubricStrengths = (evaluation?.rubric?.strengths as string[] | undefined) || [];
  const rubricImprovements = (evaluation?.rubric?.improvements as string[] | undefined) || [];

  const verdictColor =
    evaluation?.verdict === "pass"
      ? "#10b981"
      : evaluation?.verdict === "needs_revision"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <>
      <PageHeader
        icon={<Eye size={14} />}
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
              hasUploadedFile={submission?.hasUploadedFile}
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

            {canReview ? (
              <div className="actions" style={{ marginTop: 16, flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="button primary" type="button" disabled={!submission || Boolean(busyAction) || !wallet.address} onClick={approve}>
                    <CheckCircle2 size={16} />
                    Approve &amp; pay worker
                  </button>
                  <button className="button" type="button" disabled={!submission || Boolean(busyAction) || !wallet.address} onClick={revise}>
                    <RotateCcw size={16} />
                    Ask for changes
                  </button>
                  <button className="button" type="button" disabled={!submission || Boolean(busyAction) || !wallet.address} onClick={reject}>
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
          {/* AI Deliverable Judge Panel */}
          <div className="panel" style={{ border: "1px solid var(--border)", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={16} style={{ color: "#a855f7" }} />
                <h2 className="panel-title" style={{ margin: 0 }}>AI Judge Evaluation</h2>
              </div>
              <button
                className="button ghost small"
                type="button"
                disabled={!submission || isEvaluating}
                onClick={handleRunAiEvaluation}
                title="Run or refresh AI evaluation"
                style={{ fontSize: 12, padding: "4px 8px" }}
              >
                {isEvaluating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Bot size={13} />
                )}
                {evaluation ? "Re-evaluate" : "Run AI Judge"}
              </button>
            </div>

            {isEvaluating ? (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px", color: "#a855f7" }} />
                <p className="small muted">AI Judge is analyzing deliverable against acceptance criteria...</p>
              </div>
            ) : evaluation ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Score & Verdict Banner */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${verdictColor}40`,
                  }}
                >
                  <div>
                    <span className="small muted" style={{ display: "block", textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5 }}>
                      Quality Score
                    </span>
                    <strong style={{ fontSize: 22, fontWeight: 700, color: verdictColor }}>
                      {evaluation.score}
                      <span style={{ fontSize: 14, color: "var(--muted)" }}>/100</span>
                    </strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        backgroundColor: `${verdictColor}20`,
                        color: verdictColor,
                        border: `1px solid ${verdictColor}50`,
                      }}
                    >
                      {evaluation.verdict === "pass" ? "Passed Criteria" : evaluation.verdict === "needs_revision" ? "Needs Revision" : "Failed Criteria"}
                    </span>
                    <span className="small muted" style={{ display: "block", marginTop: 2, fontSize: 10 }}>
                      {evaluation.model}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <p className="small muted" style={{ lineHeight: 1.5, margin: 0 }}>
                  {evaluation.summary}
                </p>

                {/* Criteria Checklist Breakdown */}
                {rubricAssessments.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <span className="small" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
                      Criteria Checklist ({rubricAssessments.filter(c => c.status === "met").length}/{rubricAssessments.length} Met)
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {rubricAssessments.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            padding: "6px 8px",
                            borderRadius: 6,
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            fontSize: 12,
                          }}
                        >
                          {item.status === "met" ? (
                            <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0, marginTop: 2 }} />
                          ) : item.status === "partial" ? (
                            <AlertTriangle size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                          ) : (
                            <XCircle size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, color: "var(--foreground)" }}>{item.criterion}</div>
                            {item.comment && (
                              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{item.comment}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Improvements */}
                {rubricStrengths.length > 0 && (
                  <div style={{ marginTop: 2 }}>
                    <span className="small muted" style={{ fontWeight: 600, display: "block", marginBottom: 4, fontSize: 11, color: "#10b981" }}>
                      Key Strengths:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "var(--muted)" }}>
                      {rubricStrengths.map((str, idx) => (
                        <li key={idx} style={{ marginBottom: 2 }}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {rubricImprovements.length > 0 && (
                  <div style={{ marginTop: 2 }}>
                    <span className="small muted" style={{ fontWeight: 600, display: "block", marginBottom: 4, fontSize: 11, color: "#f59e0b" }}>
                      Recommendations:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "var(--muted)" }}>
                      {rubricImprovements.map((imp, idx) => (
                        <li key={idx} style={{ marginBottom: 2 }}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p className="small muted" style={{ margin: "0 0 10px" }}>
                  Automated AI deliverable evaluation has not been generated yet.
                </p>
                <button
                  className="button secondary small"
                  type="button"
                  disabled={!submission || isEvaluating}
                  onClick={handleRunAiEvaluation}
                >
                  <Sparkles size={14} style={{ color: "#a855f7" }} />
                  Run AI Judge Evaluation
                </button>
              </div>
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
