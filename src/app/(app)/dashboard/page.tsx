"use client";

import { ArrowRight, CheckCircle2, ClipboardList, Plus, Sparkles, WalletCards } from "lucide-react";
import Link from "next/link";
import { PageHeader, StatCard, WalletPill } from "@/components/app-shell";
import { ChainTxLink, JobRow } from "@/components/job-components";
import { formatUsdcUnits } from "@/lib/money";
import { recommendJobs } from "@/lib/recommendations";
import { useWorkNet } from "@/lib/store";

export default function DashboardPage() {
  const { state, activeProfile, getProfile, getAgent } = useWorkNet();
  const myJobs = state.jobs.filter(
    (job) => job.clientProfileId === activeProfile?.id || job.providerProfileId === activeProfile?.id,
  );
  const pendingReviews = state.jobs.filter(
    (job) => job.clientProfileId === activeProfile?.id && job.status === "submitted",
  );
  const openApplications = state.applications.filter((application) => application.status === "pending");
  const escrowed = state.jobs
    .filter((job) => ["funded", "submitted", "revision_requested"].includes(job.status))
    .reduce((sum, job) => sum + job.budgetUsdcUnits, 0);
  const profileLabel = activeProfile?.displayName ?? "Guest";
  const recommendations = activeProfile ? recommendJobs(state.jobs, activeProfile, 5) : [];

  return (
    <>
      <PageHeader
        eyebrow="Command center"
        title={`Welcome, ${profileLabel}`}
        subtitle="Track escrow, pending approvals, applications, and recent activity in one place."
        actions={
          <>
            <WalletPill />
            <Link className="button primary" href="/jobs/new">
              <Plus size={17} />
              New job
            </Link>
          </>
        }
      />

      <section className="stat-grid" style={{ marginBottom: 16 }}>
        <StatCard label="My jobs" value={String(myJobs.length)} />
        <StatCard label="Pending review" value={String(pendingReviews.length)} />
        <StatCard label="Escrowed" value={formatUsdcUnits(escrowed, { compact: true })} />
        <StatCard label="Applications" value={String(openApplications.length)} />
      </section>

      <section className="layout-with-rail">
        <div className="grid">
          {recommendations.length > 0 ? (
            <div className="panel">
              <div className="panel-header">
                <div className="profile-strip">
                  <span className="avatar">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <h2 className="panel-title">For you</h2>
                    <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                      Open jobs matched to your skills.
                    </p>
                  </div>
                </div>
                <Link className="button ghost" href="/jobs">
                  Browse all
                  <ArrowRight size={16} />
                </Link>
              </div>
              <ul className="recommend-list">
                {recommendations.map(({ job, matchedSkills }) => (
                  <li key={job.id}>
                    <Link className="recommend-row" href={`/jobs/${job.id}`}>
                      <div>
                        <strong>{job.title}</strong>
                        <div className="small muted">
                          {job.category} · {job.tags.slice(0, 3).join(" / ")}
                        </div>
                      </div>
                      <div className="recommend-meta">
                        <span className="recommend-budget">
                          {formatUsdcUnits(job.budgetUsdcUnits, { compact: true })}
                        </span>
                        <div className="tags recommend-tags">
                          {matchedSkills.slice(0, 4).map((skill) => (
                            <span className="tag matched" key={skill}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Active work</h2>
                <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                  Jobs where this profile is the client or selected human provider.
                </p>
              </div>
              <Link className="button ghost" href="/jobs">
                View all
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="job-list">
              {myJobs.slice(0, 4).map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  client={getProfile(job.clientProfileId)}
                  provider={getProfile(job.providerProfileId)}
                  agent={getAgent(job.providerAgentId)}
                />
              ))}
              {myJobs.length === 0 ? <div className="empty">No active jobs for this profile.</div> : null}
            </div>
          </div>
        </div>

        <aside className="grid">
          <div className="panel">
            <div className="profile-strip">
              <span className="avatar">
                <ClipboardList size={18} />
              </span>
              <div>
                <h2 className="panel-title">Next actions</h2>
                <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                  Keep funded work moving.
                </p>
              </div>
            </div>
            <div className="activity-list" style={{ marginTop: 16 }}>
              {pendingReviews.map((job) => (
                <Link className="activity-item" key={job.id} href={`/jobs/${job.id}/review`}>
                  <span className="activity-icon">
                    <CheckCircle2 size={16} />
                  </span>
                  <span>
                    <strong>{job.title}</strong>
                    <span className="small muted hide-mobile" style={{ display: "block", marginTop: 3 }}>
                      Review submitted deliverable
                    </span>
                  </span>
                </Link>
              ))}
              {pendingReviews.length === 0 ? <p className="muted">No approvals waiting.</p> : null}
            </div>
          </div>

          <div className="panel hide-mobile">
            <div className="profile-strip">
              <span className="avatar">
                <WalletCards size={18} />
              </span>
              <div>
                <h2 className="panel-title">Latest tx</h2>
                <p className="small muted" style={{ margin: "4px 0 0" }}>
                  Deterministic Arc finality means one confirmation is final.
                </p>
              </div>
            </div>
            <div className="activity-list" style={{ marginTop: 16 }}>
              {state.transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="activity-item">
                  <span className="activity-icon">
                    <WalletCards size={16} />
                  </span>
                  <span>
                    <strong>{tx.method}</strong>
                    <span className="small muted" style={{ display: "block", marginTop: 3 }}>
                      Block {tx.blockNumber ?? "pending"}
                    </span>
                    <span style={{ display: "block", marginTop: 8 }}>
                      <ChainTxLink txHash={tx.txHash} />
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
