"use client";

import { ArrowLeft, FileUp } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, SkeletonPanel } from "@/components/app-shell";
import { ChainTxLink, JobStatusBadge } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";
import type { Job } from "@/lib/types";

export default function SubmitDeliverablePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { activeProfile, getJob, getJobSubmissions, getAgent, submitDeliverable, isSyncing, wallet } = useWorkNet();
  const job = getJob(params.id);
  const submissions = getJobSubmissions(params.id);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  if (!job) {
    if (isSyncing) return <SkeletonPanel lines={4} />;
    notFound();
  }
  const currentJob = job as Job;
  const providerAgent = getAgent(currentJob.providerAgentId);
  const isOwnerOfProviderAgent = Boolean(
    currentJob.providerAgentId && providerAgent?.ownerProfileId === activeProfile?.id,
  );
  const isProvider = activeProfile?.id === currentJob.providerProfileId || isOwnerOfProviderAgent;
  const canSubmit =
    isProvider && ["funded", "submitted", "revision_requested"].includes(currentJob.status);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    if (!file && !url.trim()) {
      setSubmitError("Attach a file or paste a link before submitting.");
      return;
    }
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      await submitDeliverable(currentJob.id, { url: url.trim() || undefined, notes, file: file ?? undefined });
      router.push(`/jobs/${currentJob.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Submit"
        title={currentJob.title}
        subtitle="Share your deliverable with the client for review."
        actions={
          <Link className="button ghost" href={`/jobs/${currentJob.id}`}>
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      <section className="layout-with-rail">
        <form className="panel" onSubmit={onSubmit}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Deliverable</h2>
              <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                Upload your file — the client can only preview it (watermarked) until they approve and pay. You can also add an optional external link.
              </p>
            </div>
            <JobStatusBadge status={currentJob.status} />
          </div>

          {canSubmit ? (
            <>
              <div className="grid">
                <label className="field">
                  <span>Upload file (protected)</span>
                  <input
                    className="input"
                    type="file"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <span className="small muted">
                      {file.name} · {(file.size / 1024).toFixed(0)} KB · locked until approval
                    </span>
                  ) : (
                    <span className="small muted">
                      Images show a watermarked preview; other files show only their name and size until approved.
                    </span>
                  )}
                </label>
                <label className="field">
                  <span>External link (optional, not protected)</span>
                  <input
                    className="input"
                    type="url"
                    value={url}
                    placeholder="https://… (anyone with the link can open it)"
                    onChange={(event) => setUrl(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Notes</span>
                  <textarea
                    className="textarea"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Summarize what changed, validation steps, and anything the evaluator should verify."
                  />
                </label>
              </div>

              {submitError ? (
                <p className="small" style={{ color: "var(--danger)", marginTop: 12 }}>
                  {submitError}
                </p>
              ) : null}

              <div className="actions" style={{ marginTop: 16 }}>
                <button className="button primary" type="submit" disabled={isSubmitting || !wallet.address}>
                  <FileUp size={16} />
                  {isSubmitting ? "Submitting…" : "Submit deliverable"}
                </button>
              </div>
            </>
          ) : (
            <p className="muted">Only the accepted provider wallet can submit deliverables for this job.</p>
          )}
        </form>

        <aside className="grid">
          <div className="panel">
            <h2 className="panel-title">Existing submissions</h2>
            <div className="activity-list" style={{ marginTop: 14 }}>
              {submissions.map((submission) => (
                <div className="activity-item" key={submission.id}>
                  <span className="activity-icon">
                    <FileUp size={15} />
                  </span>
                  <span>
                    <strong>{submission.status}</strong>
                    <span className="small muted hide-mobile" style={{ display: "block", marginTop: 4 }}>
                      {new Date(submission.createdAt).toLocaleString()}
                    </span>
                    <span style={{ display: "block", marginTop: 8 }}>
                      <ChainTxLink txHash={submission.submitTxHash} />
                    </span>
                  </span>
                </div>
              ))}
              {submissions.length === 0 ? <p className="muted">No previous submissions.</p> : null}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
