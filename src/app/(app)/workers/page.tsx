"use client";

import { Filter, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader, SkeletonPanel, StatCard } from "@/components/app-shell";
import { ProfileReputationBadges } from "@/components/job-components";
import { availabilityLabel } from "@/lib/availability";
import { formatUsdcUnits } from "@/lib/money";
import { useWorkNet } from "@/lib/store";
import type { Availability } from "@/lib/types";

type SortKey = "rating" | "jobs" | "earnings" | "name";
type RoleFilter = "all" | "worker" | "agent_owner";

const roles: RoleFilter[] = ["all", "worker", "agent_owner"];
const availabilityOptions: Array<"all" | Availability> = ["all", "open", "limited", "unavailable"];

export default function WorkersDirectoryPage() {
  const { state, isSyncing } = useWorkNet();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [skill, setSkill] = useState("all");
  const [availability, setAvailability] = useState<(typeof availabilityOptions)[number]>("all");
  const [sort, setSort] = useState<SortKey>("rating");

  const candidates = state.profiles.filter(
    (profile) => profile.role === "worker" || profile.role === "agent_owner",
  );

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    for (const profile of candidates) {
      for (const item of profile.skills) set.add(item);
    }
    return ["all", ...Array.from(set).sort()];
  }, [candidates]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return candidates
      .filter((profile) => {
        const matchesQuery =
          !normalized ||
          [profile.displayName, profile.handle, profile.bio, profile.skills.join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        const matchesRole = role === "all" || profile.role === role;
        const matchesSkill = skill === "all" || profile.skills.includes(skill);
        const matchesAvailability = availability === "all" || profile.availability === availability;
        return matchesQuery && matchesRole && matchesSkill && matchesAvailability;
      })
      .sort((a, b) => {
        if (sort === "rating") return b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount;
        if (sort === "jobs") return b.completedJobsCount - a.completedJobsCount;
        if (sort === "earnings") return b.totalEarnedUsdcUnits - a.totalEarnedUsdcUnits;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [candidates, query, role, skill, availability, sort]);

  const activeFilterCount =
    (role !== "all" ? 1 : 0) +
    (skill !== "all" ? 1 : 0) +
    (availability !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function clearFilters() {
    setQuery("");
    setRole("all");
    setSkill("all");
    setAvailability("all");
  }

  const showSkeleton = isSyncing && candidates.length === 0;

  return (
    <>
      <PageHeader
        icon={<Users size={14} />}
        eyebrow="Workers"
        title="Talent directory"
        subtitle="Browse workers and agent operators by skill, availability, and on-chain reputation."
      />

      {showSkeleton ? <SkeletonPanel lines={6} /> : null}
      {showSkeleton ? null : (
      <>
      <section className="stat-grid" style={{ marginBottom: 16 }}>
        <StatCard label="Workers" value={String(candidates.length)} />
        <StatCard
          label="Open to work"
          value={String(candidates.filter((p) => p.availability === "open").length)}
        />
        <StatCard label="Skills" value={String(skillOptions.length - 1)} />
        <StatCard
          label="Avg rating"
          value={(
            candidates.reduce((sum, p) => sum + p.ratingAvg, 0) / Math.max(candidates.length, 1)
          ).toFixed(2)}
        />
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
                placeholder="Search by name, handle, bio, or skill"
              />
            </span>
          </label>
          <label className="field">
            <span className="small muted">Role</span>
            <select
              className="select"
              value={role}
              onChange={(event) => setRole(event.target.value as RoleFilter)}
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item === "all"
                    ? "Workers & operators"
                    : item === "worker"
                    ? "Human worker"
                    : "Agent operator"}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small muted">Skill</span>
            <select className="select" value={skill} onChange={(event) => setSkill(event.target.value)}>
              {skillOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Any skill" : item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small muted">Availability</span>
            <select
              className="select"
              value={availability}
              onChange={(event) => setAvailability(event.target.value as Availability | "all")}
            >
              {availabilityOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "Any availability" : availabilityLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="small muted">Sort by</span>
            <select
              className="select"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              <option value="rating">Rating</option>
              <option value="jobs">Jobs completed</option>
              <option value="earnings">Earnings</option>
              <option value="name">Name</option>
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

        <div className="panel-header">
          <div className="profile-strip">
            <span className="avatar">
              <Filter size={18} />
            </span>
            <div>
              <h2 className="panel-title">{filtered.length} workers</h2>
              <p className="small muted" style={{ margin: "4px 0 0" }}>
                Rates and earnings shown in USDC.
              </p>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={18} />}
            title="No workers match"
            description="Try clearing filters or broadening the search."
            action={
              activeFilterCount > 0 ? (
                <button type="button" className="button" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null
            }
          />
        ) : (
          <ul className="worker-grid">
            {filtered.map((profile) => (
              <li key={profile.id}>
                <Link className="worker-card" href={`/workers/${profile.id}`}>
                  <div className="profile-strip">
                    <span className="avatar">{profile.displayName.charAt(0)}</span>
                    <div>
                      <strong>{profile.displayName}</strong>
                      <div className="small muted">@{profile.handle}</div>
                    </div>
                  </div>
                  <p className="small muted worker-bio">{profile.bio}</p>
                  <ProfileReputationBadges profile={profile} />
                  {profile.skills.length > 0 ? (
                    <div className="tags worker-skills">
                      {profile.skills.slice(0, 6).map((s) => (
                        <span className="tag" key={s}>
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <dl className="worker-stats">
                    <div>
                      <dt>Rating</dt>
                      <dd>{profile.ratingAvg.toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt>Jobs</dt>
                      <dd>{profile.completedJobsCount}</dd>
                    </div>
                    <div>
                      <dt>Earned</dt>
                      <dd>{formatUsdcUnits(profile.totalEarnedUsdcUnits, { compact: true })}</dd>
                    </div>
                    <div>
                      <dt>Rate</dt>
                      <dd>
                        {profile.hourlyRateUsdcUnits
                          ? `${formatUsdcUnits(profile.hourlyRateUsdcUnits, { compact: true })}/hr`
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                  <span className={`availability availability-${profile.availability ?? "unknown"} small`}>
                    {availabilityLabel(profile.availability)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      </>
      )}
    </>
  );
}
