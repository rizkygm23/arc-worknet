"use client";

import { Check, ClipboardList, Inbox, Send, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/app-shell";
import { JobStatusBadge } from "@/components/job-components";
import { useApplicationOverlay } from "@/lib/application-overlay";
import { useJobInvitations } from "@/lib/job-invitations";
import { useWorkNet } from "@/lib/store";
import type { ApplicationStatus } from "@/lib/types";

function statusBadge(status: ApplicationStatus) {
  return (
    <span className={`badge application-status application-${status}`}>
      {status === "pending" ? <Send size={12} /> : null}
      {status === "accepted" ? <Check size={12} /> : null}
      {status === "rejected" ? <X size={12} /> : null}
      {status === "withdrawn" ? <X size={12} /> : null}
      {status}
    </span>
  );
}

export default function ApplicationsPage() {
  const { state, activeProfile, getJob, getProfile, getAgent } = useWorkNet();
  const { withdraw, getEffectiveStatus, getDeclineReason } = useApplicationOverlay();
  const { invitations, respondInvite, hydrated: invitesHydrated } = useJobInvitations();

  const myApplications = useMemo(() => {
    if (!activeProfile) return [];
    const myAgentIds = new Set(
      state.agents.filter((a) => a.ownerProfileId === activeProfile.id).map((a) => a.id),
    );
    return state.applications.filter(
      (application) =>
        application.applicantProfileId === activeProfile.id ||
        (application.applicantAgentId && myAgentIds.has(application.applicantAgentId)),
    );
  }, [state.applications, state.agents, activeProfile]);

  const receivedApplications = useMemo(() => {
    if (!activeProfile) return [];
    return state.applications.filter((application) => {
      const job = getJob(application.jobId);
      return job?.clientProfileId === activeProfile.id;
    });
  }, [state.applications, activeProfile, getJob]);

  const sentInvitations = useMemo(
    () =>
      activeProfile
        ? invitations.filter((inv) => inv.fromClientProfileId === activeProfile.id)
        : [],
    [invitations, activeProfile],
  );

  const receivedInvitations = useMemo(
    () =>
      activeProfile
        ? invitations.filter((inv) => inv.toWorkerProfileId === activeProfile.id)
        : [],
    [invitations, activeProfile],
  );

  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="Applicant pipeline"
        subtitle="Track sent and received applications, plus invitations, before a provider is selected."
      />

      {invitesHydrated && receivedInvitations.length > 0 ? (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <div className="profile-strip">
              <span className="avatar">
                <Inbox size={18} />
              </span>
              <div>
                <h2 className="panel-title">Invitations for you</h2>
                <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                  Clients reaching out directly.
                </p>
              </div>
            </div>
          </div>
          <ul className="invitation-list">
            {receivedInvitations.map((inv) => {
              const job = getJob(inv.jobId);
              const fromClient = getProfile(inv.fromClientProfileId);
              return (
                <li key={inv.id} className="invitation-item">
                  <div>
                    <Link className="invitation-title" href={`/jobs/${inv.jobId}`}>
                      <strong>{job?.title ?? "Job removed"}</strong>
                    </Link>
                    <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                      from {fromClient?.displayName ?? "Unknown"} ·{" "}
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                    <p className="muted" style={{ margin: "8px 0 0" }}>{inv.message}</p>
                  </div>
                  <div className="invitation-actions">
                    {inv.status === "pending" ? (
                      <>
                        <button
                          className="button primary small"
                          type="button"
                          onClick={() => respondInvite(inv.id, "accepted")}
                        >
                          <Check size={12} />
                          Accept
                        </button>
                        <button
                          className="button ghost small"
                          type="button"
                          onClick={() => respondInvite(inv.id, "declined")}
                        >
                          <X size={12} />
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className={`badge invite-status invite-${inv.status}`}>{inv.status}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {invitesHydrated && sentInvitations.length > 0 ? (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <div className="profile-strip">
              <span className="avatar">
                <Send size={18} />
              </span>
              <div>
                <h2 className="panel-title">Invitations you sent</h2>
              </div>
            </div>
          </div>
          <ul className="invitation-list">
            {sentInvitations.map((inv) => {
              const job = getJob(inv.jobId);
              const toWorker = getProfile(inv.toWorkerProfileId);
              return (
                <li key={inv.id} className="invitation-item">
                  <div>
                    <Link className="invitation-title" href={`/jobs/${inv.jobId}`}>
                      <strong>{job?.title ?? "Job removed"}</strong>
                    </Link>
                    <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                      to {toWorker?.displayName ?? "Unknown"} ·{" "}
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`badge invite-status invite-${inv.status}`}>{inv.status}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {activeProfile && myApplications.length > 0 ? (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <div className="profile-strip">
              <span className="avatar">
                <Send size={18} />
              </span>
              <div>
                <h2 className="panel-title">Applications you sent</h2>
              </div>
            </div>
          </div>
          <ul className="invitation-list">
            {myApplications.map((application) => {
              const job = getJob(application.jobId);
              const effectiveStatus = getEffectiveStatus(application.id, application.status);
              const declineReason = getDeclineReason(application.id);
              return (
                <li key={application.id} className="invitation-item">
                  <div>
                    <Link className="invitation-title" href={`/jobs/${application.jobId}`}>
                      <strong>{job?.title ?? "Job removed"}</strong>
                    </Link>
                    <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                      {application.actorType} application ·{" "}
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                    <p className="muted" style={{ margin: "8px 0 0" }}>{application.pitch}</p>
                    {effectiveStatus === "rejected" && declineReason ? (
                      <p className="small muted" style={{ margin: "6px 0 0" }}>
                        <strong>Decline reason:</strong> {declineReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="invitation-actions">
                    {statusBadge(effectiveStatus)}
                    {effectiveStatus === "pending" ? (
                      <button
                        className="button ghost small"
                        type="button"
                        onClick={() => withdraw(application.id)}
                      >
                        <X size={12} />
                        Withdraw
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <div className="profile-strip">
            <span className="avatar">
              <ClipboardList size={18} />
            </span>
            <div>
              <h2 className="panel-title">
                {activeProfile && receivedApplications.length > 0
                  ? "Applications you received"
                  : "All applications"}
              </h2>
            </div>
          </div>
        </div>
        <div className="activity-list">
          {(receivedApplications.length > 0 ? receivedApplications : state.applications).map(
            (application) => {
              const job = getJob(application.jobId);
              const profile = getProfile(application.applicantProfileId);
              const agent = getAgent(application.applicantAgentId);
              const effectiveStatus = getEffectiveStatus(application.id, application.status);
              return (
                <Link
                  key={application.id}
                  className="activity-item"
                  href={`/jobs/${application.jobId}`}
                >
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
                      {statusBadge(effectiveStatus)}
                    </span>
                  </span>
                </Link>
              );
            },
          )}
          {state.applications.length === 0 ? <div className="empty">No applications yet.</div> : null}
        </div>
      </section>
    </>
  );
}
