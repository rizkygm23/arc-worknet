"use client";

import { Briefcase, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { EmptyState, PageHeader, SkeletonPanel, StatCard, WalletPill } from "@/components/app-shell";
import { JobRow } from "@/components/job-components";
import { useSavedJobs } from "@/lib/saved-jobs";
import { formatUsdcUnits } from "@/lib/money";
import { useWorkNet } from "@/lib/store";
import { useStatistics } from "@/lib/use-statistics";
import type { ActorType, Agent, Job, JobStatus, Profile } from "@/lib/types";

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
  const { state } = useWorkNet();
  const statistics = useStatistics(state.activeProfileId);
  const { savedIds, isSaved, toggleSaved, hydrated } = useSavedJobs();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | JobStatus>("all");
  const [category, setCategory] = useState("all");
  const [actorType, setActorType] = useState<"all" | ActorType>("all");
  const [budgetBucket, setBudgetBucket] = useState<BudgetBucketId>("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pageJobs, setPageJobs] = useState<Job[]>([]);
  const [pageProfiles, setPageProfiles] = useState<Profile[]>([]);
  const [pageAgents, setPageAgents] = useState<Agent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();

  const categories = useMemo(
    () => ["all", ...Array.from(new Set([...state.jobs, ...pageJobs].map((job) => job.category)))],
    [pageJobs, state.jobs],
  );

  const loadPage = useCallback(async (cursor?: string) => {
    setIsLoading(true);
    setLoadError(undefined);
    try {
      const params = new URLSearchParams({ limit: "24" });
      if (cursor) params.set("cursor", cursor);
      if (status !== "all") params.set("status", status);
      if (category !== "all") params.set("category", category);
      if (actorType !== "all") params.set("actorType", actorType);
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/jobs?${params}`, { cache: "no-store", credentials: "include" });
      const body = await response.json() as {
        items?: Job[];
        profiles?: Profile[];
        agents?: Agent[];
        nextCursor?: string | null;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || `Jobs request failed with ${response.status}`);
      setPageJobs((current) => cursor ? [...current, ...(body.items ?? [])] : (body.items ?? []));
      setPageProfiles((current) => cursor ? [...current, ...(body.profiles ?? [])] : (body.profiles ?? []));
      setPageAgents((current) => cursor ? [...current, ...(body.agents ?? [])] : (body.agents ?? []));
      setNextCursor(body.nextCursor ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load jobs.");
    } finally {
      setIsLoading(false);
    }
  }, [actorType, category, query, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadPage(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadPage]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !nextCursor || isLoading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadPage(nextCursor);
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [isLoading, loadPage, nextCursor]);

  const jobs = useMemo(() => {
    const bucket = budgetBuckets.find((item) => item.id === budgetBucket)!;
    return pageJobs.filter((job) => {
      const matchesBudget = job.budgetUsdcUnits >= bucket.min && job.budgetUsdcUnits < bucket.max;
      const matchesSaved = !showSavedOnly || savedIds.has(job.id);
      return matchesBudget && matchesSaved;
    });
  }, [budgetBucket, pageJobs, savedIds, showSavedOnly]);

  const totalJobs = statistics?.public.totalJobs ?? pageJobs.length;
  const openBudget = statistics?.public.openBudgetUsdcUnits ?? 0;
  const myApplications = statistics?.private?.myApplications ?? state.applications.length;
  const knownAgents = statistics?.public.knownAgents ?? state.agents.length;

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

  const showSkeleton = isLoading && pageJobs.length === 0;

  return (
    <>
      <PageHeader
        icon={<Briefcase size={14} />}
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
      <section className="stat-grid" style={{ marginBottom: "var(--space-5)" }}>
        <StatCard label="Total jobs" value={String(totalJobs)} />
        <StatCard label="Open budget" value={formatUsdcUnits(openBudget, { compact: true })} />
        <StatCard label="My applications" value={String(myApplications)} />
        <StatCard label="Known agents" value={String(knownAgents)} />
      </section>

      <section className="panel">
        <div className={clsx("toolbar", showFilters && "show-expanded")}>
          <div className="toolbar-search-row">
            <label className="field search-field">
              <span className="small muted">Search</span>
              <span style={{ position: "relative" }}>
                <Search size={16} style={{ left: 12, position: "absolute", top: 13 }} />
                <input
                  className="input"
                  style={{ paddingLeft: 36 }}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title"
                />
              </span>
            </label>
            <button
              type="button"
              className="button secondary filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>Filters</span>
            </button>
          </div>
          
          <label className="field filter-field">
            <span className="small muted">Status</span>
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All statuses" : item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="field filter-field">
            <span className="small muted">Category</span>
            <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All categories" : item}
                </option>
              ))}
            </select>
          </label>
          <label className="field filter-field">
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
          <label className="field filter-field">
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

        {activeFilterCount > 0 ? (
          <div className="filter-bar">
            <button type="button" className="button ghost" onClick={clearFilters}>
              <X size={14} />
              Clear filters
            </button>
          </div>
        ) : null}

        <div className="panel-header jobs-header-inline">
          <div>
            <h2 className="panel-title">{jobs.length} matching jobs</h2>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              Budgets shown in USDC.
            </p>
          </div>

          <label className="inline-toggle" htmlFor="saved-only-toggle">
            <span className="inline-toggle-copy">
              <span className="small muted">Saved only</span>
              {hydrated && savedIds.size > 0 ? <span className="filter-count">{savedIds.size}</span> : null}
            </span>
            <span className={clsx("inline-toggle-track", showSavedOnly && "active")} aria-hidden>
              <span className="inline-toggle-thumb" />
            </span>
            <input
              id="saved-only-toggle"
              className="sr-only"
              type="checkbox"
              checked={showSavedOnly}
              onChange={(event) => setShowSavedOnly(event.target.checked)}
            />
          </label>
        </div>

        {loadError ? <p className="small" style={{ color: "var(--danger)", margin: "12px 0" }}>{loadError}</p> : null}
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={18} />}
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
                client={pageProfiles.find((profile) => profile.id === job.clientProfileId)}
                provider={pageProfiles.find((profile) => profile.id === job.providerProfileId)}
                agent={pageAgents.find((agent) => agent.id === job.providerAgentId)}
                saved={isSaved(job.id)}
                onToggleSave={() => toggleSaved(job.id)}
              />
            ))}
          </div>
        )}
        {nextCursor ? (
          <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
        ) : null}
        {isLoading && pageJobs.length > 0 ? (
          <p className="small muted" role="status" style={{ margin: "16px 0 0", textAlign: "center" }}>
            Loading more jobs…
          </p>
        ) : null}
      </section>
      </>
      )}
    </>
  );
}
