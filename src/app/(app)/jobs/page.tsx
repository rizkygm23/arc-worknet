"use client";

import { Bookmark, BookmarkCheck, Filter, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader, SkeletonPanel, StatCard, WalletPill } from "@/components/app-shell";
import { JobRow } from "@/components/job-components";
import { useSavedJobs } from "@/lib/saved-jobs";
import { formatUsdcUnits } from "@/lib/money";
import { useWorkNet } from "@/lib/store";
import type { ActorType, JobStatus } from "@/lib/types";

const statuses: Array<"all" | JobStatus> = [
  "all",
  "open",
  "assigned",
  "funded",
  "submitted",
  "completed",
];

const actorTypes: Array<"all" | ActorType> = ["all", "human", "agent"];

const budgetBuckets = [
  { id: "all", label: "Any budget", min: 0, max: Infinity },
  { id: "lt-100", label: "< 100", min: 0, max: 100_000_000 },
  { id: "100-500", label: "100 – 500", min: 100_000_000, max: 500_000_000 },
  { id: "500-1k", label: "500 – 1k", min: 500_000_000, max: 1_000_000_000 },
  { id: "1k-plus", label: "1k+", min: 1_000_000_000, max: Infinity },
] as const;

type BudgetBucketId = (typeof budgetBuckets)[number]["id"];

export default function JobsPage() {
  const { state, getProfile, getAgent, isSyncing } = useWorkNet();
  const { savedIds, isSaved, toggleSaved, hydrated } = useSavedJobs();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | JobStatus>("all");
  const [category, setCategory] = useState("all");
  const [actorType, setActorType] = useState<"all" | ActorType>("all");
  const [budgetBucket, setBudgetBucket] = useState<BudgetBucketId>("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(state.jobs.map((job) => job.category)))],
    [state.jobs],
  );

  const jobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const bucket = budgetBuckets.find((b) => b.id === budgetBucket)!;
    return state.jobs.filter((job) => {
      const matchesQuery =
        !normalized ||
        [job.title, job.brief, job.category, job.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesStatus = status === "all" || job.status === status;
      const matchesCategory = category === "all" || job.category === category;
      const matchesActor = actorType === "all" || job.actorType === actorType;
      const matchesBudget = job.budgetUsdcUnits >= bucket.min && job.budgetUsdcUnits < bucket.max;
      const matchesSaved = !showSavedOnly || savedIds.has(job.id);
      return matchesQuery && matchesStatus && matchesCategory && matchesActor && matchesBudget && matchesSaved;
    });
  }, [actorType, budgetBucket, category, query, savedIds, showSavedOnly, state.jobs, status]);

  const openBudget = state.jobs
    .filter((job) => ["open", "assigned", "funded", "submitted"].includes(job.status))
    .reduce((sum, job) => sum + job.budgetUsdcUnits, 0);

  const activeFilterCount =
    (status !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (actorType !== "all" ? 1 : 0) +
    (budgetBucket !== "all" ? 1 : 0) +
    (showSavedOnly ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setCategory("all");
    setActorType("all");
    setBudgetBucket("all");
    setShowSavedOnly(false);
  }

  const showSkeleton = isSyncing && state.jobs.length === 0;

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

      {showSkeleton ? <SkeletonPanel lines={6} /> : null}
      {showSkeleton ? null : (
      <>
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
          <label className="field">
            <span className="small muted">Worker type</span>
            <select
              className="select"
              value={actorType}
              onChange={(event) => setActorType(event.target.value as typeof actorType)}
            >
              {actorTypes.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Human or agent" : item === "human" ? "Human" : "AI agent"}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small muted">Budget</span>
            <select
              className="select"
              value={budgetBucket}
              onChange={(event) => setBudgetBucket(event.target.value as BudgetBucketId)}
            >
              {budgetBuckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-bar">
          <button
            type="button"
            className={showSavedOnly ? "button primary" : "button"}
            onClick={() => setShowSavedOnly((v) => !v)}
            aria-pressed={showSavedOnly}
          >
            {showSavedOnly ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {showSavedOnly ? "Saved only" : "Show saved"}
            {hydrated && savedIds.size > 0 ? (
              <span className="filter-count">{savedIds.size}</span>
            ) : null}
          </button>
          {activeFilterCount > 0 ? (
            <button type="button" className="button ghost" onClick={clearFilters}>
              <X size={14} />
              Clear filters
            </button>
          ) : null}
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

        {jobs.length === 0 ? (
          <EmptyState
            icon={<Filter size={18} />}
            title={showSavedOnly ? "No saved jobs match" : "No matching jobs"}
            description={
              showSavedOnly
                ? "Bookmark a job from the marketplace to see it here."
                : "Try clearing filters or broadening your search."
            }
            action={
              activeFilterCount > 0 ? (
                <button type="button" className="button" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null
            }
          />
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                client={getProfile(job.clientProfileId)}
                provider={getProfile(job.providerProfileId)}
                agent={getAgent(job.providerAgentId)}
                saved={isSaved(job.id)}
                onToggleSave={() => toggleSaved(job.id)}
              />
            ))}
          </div>
        )}
      </section>
      </>
      )}
    </>
  );
}
