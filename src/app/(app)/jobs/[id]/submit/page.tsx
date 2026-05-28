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
  const { activeProfile, getJob, getJobSubmissions, getAgent, submitDeliverable, isSyncing } = useWorkNet();
  const job = getJob(params.id);
  const submissions = getJobSubmissions(params.id);
  const [url, setUrl] = useState("https://example.com/worknet/deliverable");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    await submitDeliverable(currentJob.id, { url, notes });
    router.push(`/jobs/${currentJob.id}`);
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
                Paste a URL where the client can view your work, and add any handoff notes.
              </p>
            </div>
            <JobStatusBadge status={currentJob.status} />
          </div>

          {canSubmit ? (
            <>
              <div className="grid">
                <label className="field">
                  <span>Deliverable URL</span>
                  <input
                    className="input"
                    type="url"
                    required
                    value={url}
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

              <div className="actions" style={{ marginTop: 16 }}>
                <button className="button primary" type="submit" disabled={isSubmitting}>
                  <FileUp size={16} />
                  Submit deliverable
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
