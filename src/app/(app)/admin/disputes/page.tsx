"use client";

import { Gavel, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { JobStatusBadge } from "@/components/job-components";
import { formatUsdcUnits } from "@/lib/money";
import { useWorkNet } from "@/lib/store";

export default function AdminDisputesPage() {
  const { state, getProfile, getAgent, isContractOwner } = useWorkNet();
  const disputed = state.jobs.filter((job) => job.status === "disputed");

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Disputes"
        subtitle={
          isContractOwner
            ? "Jobs awaiting arbitration. Open one to split escrow between provider and client."
            : "Jobs awaiting arbitration. Only the escrow contract owner wallet can resolve them."
        }
      />

      <section className="panel">
        {disputed.length === 0 ? (
          <div className="empty">
            <div>
              <ShieldAlert size={28} />
              <p>No active disputes.</p>
            </div>
          </div>
        ) : (
          <ul className="invitation-list">
            {disputed.map((job) => {
              const client = getProfile(job.clientProfileId);
              const provider = getProfile(job.providerProfileId) ?? undefined;
              const agent = getAgent(job.providerAgentId);
              return (
                <li key={job.id} className="invitation-item">
                  <div>
                    <Link className="invitation-title" href={`/jobs/${job.id}`}>
                      <strong>{job.title}</strong>
                    </Link>
                    <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                      client {client?.displayName ?? "Unknown"} · provider{" "}
                      {provider?.displayName ?? agent?.name ?? "Unassigned"} ·{" "}
                      {formatUsdcUnits(job.budgetUsdcUnits)}
                    </span>
                  </div>
                  <div className="invitation-actions">
                    <JobStatusBadge status={job.status} />
                    {isContractOwner ? (
                      <Link className="button primary small" href={`/jobs/${job.id}/review`}>
                        <Gavel size={12} />
                        Resolve
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
