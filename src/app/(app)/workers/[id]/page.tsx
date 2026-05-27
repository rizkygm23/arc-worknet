"use client";

import { ArrowLeft, BadgeCheck, WalletCards } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { JobRow } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";

export default function WorkerProfilePage() {
  const params = useParams<{ id: string }>();
  const { getProfile, state, getAgent, isSyncing } = useWorkNet();
  const profile = getProfile(params.id);

  if (!profile) {
    if (isSyncing) return <div className="panel"><p className="muted">Loading…</p></div>;
    notFound();
  }

  const jobs = state.jobs.filter((job) => job.providerProfileId === profile.id);

  return (
    <>
      <PageHeader
        eyebrow="Worker"
        title={profile.displayName}
        subtitle={profile.bio}
        actions={
          <Link className="button ghost" href="/jobs">
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      <section className="layout-with-rail">
        <div className="grid">
          <div className="panel">
            <div className="profile-strip">
              <span className="avatar">
                <BadgeCheck size={18} />
              </span>
              <div>
                <h2 className="panel-title">{profile.handle}</h2>
                <p className="small muted" style={{ margin: "4px 0 0" }}>
                  {profile.walletAddress}
                </p>
              </div>
            </div>
          </div>
          <div className="panel">
            <h2 className="panel-title">Completed work</h2>
            <div className="job-list" style={{ marginTop: 12 }}>
              {jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  client={getProfile(job.clientProfileId)}
                  provider={profile}
                  agent={getAgent(job.providerAgentId)}
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="grid">
          <div className="panel">
            <h2 className="panel-title">Reputation</h2>
            <div className="stat" style={{ marginTop: 12 }}>
              <span>Rating</span>
              <strong>{profile.ratingAvg.toFixed(2)}</strong>
            </div>
            <div className="stat">
              <span>Completed jobs</span>
              <strong>{profile.completedJobsCount}</strong>
            </div>
            <div className="stat">
              <span>Earned</span>
              <strong>{profile.totalEarnedUsdcUnits}</strong>
            </div>
          </div>
          <div className="panel">
            <h2 className="panel-title">Wallet</h2>
            <div className="copy-box" style={{ marginTop: 12 }}>
              <WalletCards size={16} />
              {"\n"}
              {profile.walletAddress}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
