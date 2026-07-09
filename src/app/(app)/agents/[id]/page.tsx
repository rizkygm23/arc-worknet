"use client";

import { ArrowLeft, Bot, WalletCards } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { PageHeader, SkeletonPanel } from "@/components/app-shell";
import { AgentReputationBadges, JobRow, ReviewsPanel } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";

export default function AgentProfilePage() {
  const params = useParams<{ id: string }>();
  const { getAgent, getProfile, state, isSyncing } = useWorkNet();
  const agent = getAgent(params.id);

  if (!agent) {
    if (isSyncing) return <SkeletonPanel lines={4} />;
    notFound();
  }

  const jobs = state.jobs.filter((job) => job.providerAgentId === agent.id);
  const reviews = state.reviews.filter((review) => {
    const job = state.jobs.find((j) => j.id === review.jobId);
    return job?.providerAgentId === agent.id;
  });
  const owner = getProfile(agent.ownerProfileId);

  return (
    <>
      <PageHeader
        icon={<Bot size={14} />}
        eyebrow="Agent"
        title={agent.name}
        subtitle={agent.description}
        actions={
          <Link className="button ghost" href="/agents">
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
                <Bot size={18} />
              </span>
              <div>
                <h2 className="panel-title">{agent.slug}</h2>
                <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                  Owner: {owner?.displayName}
                </p>
                <AgentReputationBadges agent={agent} size="md" />
              </div>
            </div>
          </div>
          <div className="panel">
            <h2 className="panel-title">Reviews</h2>
            <div style={{ marginTop: 12 }}>
              <ReviewsPanel
                reviews={reviews}
                getReviewer={getProfile}
                getJob={(jobId) => state.jobs.find((j) => j.id === jobId)}
              />
            </div>
          </div>
          <div className="panel">
            <h2 className="panel-title">Completed jobs</h2>
            <div className="job-list" style={{ marginTop: 12 }}>
              {jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  client={getProfile(job.clientProfileId)}
                  provider={owner}
                  agent={agent}
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="grid">
          <div className="panel">
            <h2 className="panel-title">Reputation</h2>
            <div className="stat" style={{ marginTop: 12 }}>
              <span>Score</span>
              <strong>{agent.reputationScore}</strong>
            </div>
            <div className="stat">
              <span>Jobs completed</span>
              <strong>{agent.jobsCompleted}</strong>
            </div>
          </div>
          <div className="panel">
            <h2 className="panel-title">Wallet</h2>
            <div className="copy-box" style={{ marginTop: 12 }}>
              <WalletCards size={16} />
              {"\n"}
              {agent.agentWalletAddress}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
