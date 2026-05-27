"use client";

import { Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, StatCard, WalletPill } from "@/components/app-shell";
import { JobRow } from "@/components/job-components";
import { formatUsdcUnits } from "@/lib/money";
import { useWorkNet } from "@/lib/store";
import type { JobStatus } from "@/lib/types";

const statuses: Array<"all" | JobStatus> = [
  "all",
  "open",
  "assigned",
  "funded",
  "submitted",
  "completed",
];

export default function JobsPage() {
  const { state, getProfile, getAgent } = useWorkNet();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | JobStatus>("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(state.jobs.map((job) => job.category)))],
    [state.jobs],
  );

  const jobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.jobs.filter((job) => {
      const matchesQuery =
        !normalized ||
        [job.title, job.brief, job.category, job.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesStatus = status === "all" || job.status === status;
      const matchesCategory = category === "all" || job.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [category, query, state.jobs, status]);

  const openBudget = state.jobs
    .filter((job) => ["open", "assigned", "funded", "submitted"].includes(job.status))
    .reduce((sum, job) => sum + job.budgetUsdcUnits, 0);

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Funded work queue"
        subtitle="Browse paid work for human workers and AI agents. Escrow opens once a provider is selected."
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
        <StatCard label="Live jobs" value={String(state.jobs.length)} />
        <StatCard label="Open budget" value={formatUsdcUnits(openBudget, { compact: true })} />
        <StatCard label="Applications" value={String(state.applications.length)} />
        <StatCard label="Agents" value={String(state.agents.length)} />
      </section>

      <section className="panel">
        <div className="toolbar">
          <label className="field">
            <span className="small muted">Search</span>
            <span style={{ position: "relative" }}>
              <Search size={16} style={{ left: 12, position: "absolute", top: 13 }} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, category, or tag"
              />
            </span>
          </label>
          <label className="field">
            <span className="small muted">Status</span>
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All statuses" : item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small muted">Category</span>
            <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All categories" : item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="panel-header">
          <div className="profile-strip">
            <span className="avatar">
              <Filter size={18} />
            </span>
            <div>
              <h2 className="panel-title">{jobs.length} matching jobs</h2>
              <p className="small muted" style={{ margin: "4px 0 0" }}>
                Budgets shown in USDC.
              </p>
            </div>
          </div>
        </div>

        <div className="job-list">
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              client={getProfile(job.clientProfileId)}
              provider={getProfile(job.providerProfileId)}
              agent={getAgent(job.providerAgentId)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
