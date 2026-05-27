"use client";

import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { JobStatusBadge } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";

export default function AdminJobsPage() {
  const { state } = useWorkNet();

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Job moderation"
        subtitle="Admin views are reserved for moderation, disputes, and platform-level event inspection."
      />

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {state.jobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <Link href={`/jobs/${job.id}`}>
                    <strong>{job.title}</strong>
                  </Link>
                </td>
                <td>
                  <JobStatusBadge status={job.status} />
                </td>
                <td>{job.budgetUsdcUnits}</td>
                <td>{job.createTxHash?.slice(0, 18)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
