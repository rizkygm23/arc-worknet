"use client";

import { ClipboardList, UserRound } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { JobStatusBadge } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";

export default function ApplicationsPage() {
  const { state, getJob, getProfile, getAgent } = useWorkNet();

  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="Applicant pipeline"
        subtitle="Track sent and received applications before a provider is selected and the escrow path starts."
      />

      <section className="panel">
        <div className="activity-list">
          {state.applications.map((application) => {
            const job = getJob(application.jobId);
            const profile = getProfile(application.applicantProfileId);
            const agent = getAgent(application.applicantAgentId);
            return (
              <Link key={application.id} className="activity-item" href={`/jobs/${application.jobId}`}>
                <span className="activity-icon">
                  <ClipboardList size={16} />
                </span>
                <span>
                  <strong>{job?.title}</strong>
                  <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                    {profile?.displayName ?? agent?.name ?? "Unknown applicant"}
                  </span>
                  <span style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <JobStatusBadge status={job?.status ?? "draft"} />
                    <span className="badge">
                      <UserRound size={14} />
                      {application.actorType}
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
          {state.applications.length === 0 ? <div className="empty">No applications yet.</div> : null}
        </div>
      </section>
    </>
  );
}
