"use client";

import { ArrowLeft, BadgeCheck, Briefcase, Check, Send, User, WalletCards, X } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader, SkeletonPanel } from "@/components/app-shell";
import CountUp from "@/components/CountUp";
import { JobRow, ProfileReputationBadges, ReviewsPanel } from "@/components/job-components";
import { availabilityLabel } from "@/lib/availability";
import { useJobInvitations } from "@/lib/job-invitations";
import { formatUsdcUnits } from "@/lib/money";
import { useWorkNet } from "@/lib/store";
import type { Profile } from "@/lib/types";

function InvitePanel({ worker }: { worker: Profile }) {
  const { state, activeProfile } = useWorkNet();
  const { invitations, sendInvite, hydrated } = useJobInvitations();
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState("");
  const [message, setMessage] = useState(
    `Hey ${worker.displayName.split(" ")[0]} — I'd love to have you on this scope. Can you take a look?`,
  );
  const [submitted, setSubmitted] = useState(false);

  const myOpenJobs = useMemo(
    () =>
      activeProfile
        ? state.jobs.filter(
            (job) => job.clientProfileId === activeProfile.id && job.status === "open",
          )
        : [],
    [state.jobs, activeProfile],
  );

  const sentToWorker = useMemo(
    () =>
      activeProfile
        ? invitations.filter(
            (inv) =>
              inv.fromClientProfileId === activeProfile.id && inv.toWorkerProfileId === worker.id,
          )
        : [],
    [invitations, activeProfile, worker.id],
  );

  if (!activeProfile || activeProfile.role !== "client") return null;
  if (activeProfile.id === worker.id) return null;

  function handleSubmit() {
    if (!activeProfile || !jobId || !message.trim()) return;
    sendInvite({
      jobId,
      fromClientProfileId: activeProfile.id,
      toWorkerProfileId: worker.id,
      message,
    });
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
    }, 1200);
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Invite to a job</h2>
        {sentToWorker.length > 0 ? (
          <span className="small muted">
            {sentToWorker.length} invitation{sentToWorker.length === 1 ? "" : "s"} sent
          </span>
        ) : null}
      </div>

      {!open ? (
        <button
          className="button primary"
          type="button"
          onClick={() => setOpen(true)}
          disabled={!hydrated || myOpenJobs.length === 0}
          style={{ marginTop: 12 }}
        >
          <Send size={14} />
          {myOpenJobs.length === 0 ? "No open jobs to invite" : "Send invitation"}
        </button>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <label className="field">
            <span className="small muted">Job</span>
            <select
              className="select"
              value={jobId}
              onChange={(event) => setJobId(event.target.value)}
              aria-label="Select job"
            >
              <option value="">Select a job…</option>
              {myOpenJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} · {formatUsdcUnits(job.budgetUsdcUnits, { compact: true })}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small muted">Message</span>
            <textarea
              className="textarea"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              aria-label="Invitation message"
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="button primary"
              type="button"
              onClick={handleSubmit}
              disabled={!jobId || !message.trim() || submitted}
            >
              <Send size={14} />
              {submitted ? "Sent" : "Send invitation"}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitted}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sentToWorker.length > 0 ? (
        <ul className="invite-list" style={{ marginTop: 14 }}>
          {sentToWorker.slice(0, 3).map((inv) => {
            const job = state.jobs.find((j) => j.id === inv.jobId);
            return (
              <li key={inv.id} className="invite-item">
                <div>
                  <strong>{job?.title ?? "Job removed"}</strong>
                  <span className="small muted" style={{ display: "block" }}>
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`badge invite-status invite-${inv.status}`}>
                  {inv.status === "pending" ? (
                    <Send size={12} />
                  ) : inv.status === "accepted" ? (
                    <Check size={12} />
                  ) : (
                    <X size={12} />
                  )}
                  {inv.status}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function WorkerProfilePage() {
  const params = useParams<{ id: string }>();
  const { getProfile, state, getAgent, getJob, isSyncing } = useWorkNet();
  const profile = getProfile(params.id);

  if (!profile) {
    if (isSyncing) return <SkeletonPanel lines={4} />;
    notFound();
  }

  const jobs = state.jobs.filter((job) => job.providerProfileId === profile.id);
  const reviews = state.reviews.filter((review) => {
    const job = getJob(review.jobId);
    return job?.providerProfileId === profile.id;
  });
  const availability = availabilityLabel(profile.availability);

  return (
    <>
      <PageHeader
        icon={<User size={14} />}
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
                <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                  {profile.walletAddress}
                </p>
                <ProfileReputationBadges profile={profile} size="md" />
              </div>
            </div>
            {profile.skills.length > 0 ? (
              <div className="tags" style={{ marginTop: 14 }}>
                {profile.skills.map((skill) => (
                  <span className="tag" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <InvitePanel worker={profile} />

          {profile.portfolio.length > 0 ? (
            <div className="panel">
              <h2 className="panel-title">Portfolio</h2>
              <ul className="portfolio-list" style={{ marginTop: 12 }}>
                {profile.portfolio.map((item) => (
                  <li className="portfolio-item" key={item.id}>
                    <span className="portfolio-icon" aria-hidden>
                      <Briefcase size={14} />
                    </span>
                    <div>
                      {item.url ? (
                        <a className="portfolio-title" href={item.url} target="_blank" rel="noreferrer">
                          {item.title}
                        </a>
                      ) : (
                        <strong className="portfolio-title">{item.title}</strong>
                      )}
                      {item.description ? <p className="small muted">{item.description}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="panel">
            <h2 className="panel-title">Reviews</h2>
            <div style={{ marginTop: 12 }}>
              <ReviewsPanel reviews={reviews} getReviewer={getProfile} getJob={getJob} />
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
              <strong>
                <CountUp from={0} to={profile.ratingAvg} duration={1} delay={0} decimals={2} />
              </strong>
            </div>
            <div className="stat">
              <span>Completed jobs</span>
              <strong>
                <CountUp from={0} to={profile.completedJobsCount} duration={1} delay={0} />
              </strong>
            </div>
            <div className="stat">
              <span>Earned</span>
              <strong>{formatUsdcUnits(profile.totalEarnedUsdcUnits)}</strong>
            </div>
            <div className="stat">
              <span>Availability</span>
              <strong className={`availability availability-${profile.availability ?? "unknown"}`}>
                {availability}
              </strong>
            </div>
            {profile.hourlyRateUsdcUnits ? (
              <div className="stat">
                <span>Hourly rate</span>
                <strong>{formatUsdcUnits(profile.hourlyRateUsdcUnits)}/hr</strong>
              </div>
            ) : null}
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
