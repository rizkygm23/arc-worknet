"use client";

import { ArrowLeft, Briefcase, CheckCircle2, Circle, Plus, Save, Trash2, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/app-shell";
import { profileCompleteness } from "@/lib/completeness";
import { useWorkNet } from "@/lib/store";
import type { Availability, PortfolioItem } from "@/lib/types";

type EditableRole = "client" | "worker" | "agent_owner";

type FormState = {
  displayName: string;
  handle: string;
  role: EditableRole;
  bio: string;
  avatarUrl: string;
  countryCode: string;
  timezone: string;
  skills: string[];
  hourlyRateUsdc: string;
  availability: Availability | "";
  portfolio: PortfolioItem[];
};

const ROLE_OPTIONS: { value: EditableRole; label: string }[] = [
  { value: "client", label: "Client (hire)" },
  { value: "worker", label: "Worker (freelance)" },
  { value: "agent_owner", label: "Agent owner" },
];

const AVAILABILITY_OPTIONS: { value: Availability | ""; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "open", label: "Open to work" },
  { value: "limited", label: "Limited availability" },
  { value: "unavailable", label: "Unavailable" },
];

function toFormState(profile: NonNullable<ReturnType<typeof useWorkNet>["activeProfile"]>): FormState {
  return {
    displayName: profile.displayName,
    handle: profile.handle,
    role: profile.role === "admin" ? "client" : profile.role,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? "",
    countryCode: profile.countryCode,
    timezone: profile.timezone,
    skills: [...profile.skills],
    hourlyRateUsdc: profile.hourlyRateUsdcUnits ? (profile.hourlyRateUsdcUnits / 1_000_000).toString() : "",
    availability: profile.availability ?? "",
    portfolio: profile.portfolio.map((item) => ({ ...item })),
  };
}

export default function ProfilePage() {
  const { activeProfile, updateProfile } = useWorkNet();
  const [form, setForm] = useState<FormState | null>(() =>
    activeProfile ? toFormState(activeProfile) : null,
  );
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (activeProfile) {
      setForm(toFormState(activeProfile));
    }
  }, [activeProfile]);

  const completeness = useMemo(
    () => (activeProfile ? profileCompleteness(activeProfile) : null),
    [activeProfile],
  );

  if (!activeProfile || !form) {
    return (
      <>
        <PageHeader
          icon={<User size={14} />}
          eyebrow="Profile"
          title="Your account"
          subtitle="Connect a wallet from the sidebar to load your profile."
          actions={
            <Link className="button ghost" href="/dashboard">
              <ArrowLeft size={16} />
              Back
            </Link>
          }
        />
        <section className="empty">No profile selected. Connect a wallet from the sidebar first.</section>
      </>
    );
  }

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSuccess(false);
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed || !form) return;
    if (form.skills.includes(trimmed)) {
      setSkillInput("");
      return;
    }
    patch("skills", [...form.skills, trimmed]);
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    if (!form) return;
    patch(
      "skills",
      form.skills.filter((s) => s !== skill),
    );
  }

  function addPortfolioItem() {
    if (!form) return;
    const id = `portfolio_${Date.now().toString(36)}`;
    patch("portfolio", [...form.portfolio, { id, title: "", url: "", description: "" }]);
  }

  function updatePortfolio(id: string, updates: Partial<PortfolioItem>) {
    if (!form) return;
    patch(
      "portfolio",
      form.portfolio.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }

  function removePortfolio(id: string) {
    if (!form) return;
    patch(
      "portfolio",
      form.portfolio.filter((item) => item.id !== id),
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form || saving) return;

    setSaving(true);
    setError(undefined);
    setSuccess(false);

    try {
      const hourlyRate = form.hourlyRateUsdc.trim();
      const hourlyRateUsdcUnits = hourlyRate === "" ? null : Math.round(Number(hourlyRate) * 1_000_000);
      if (hourlyRateUsdcUnits !== null && (Number.isNaN(hourlyRateUsdcUnits) || hourlyRateUsdcUnits < 0)) {
        throw new Error("Hourly rate must be a positive number.");
      }

      const portfolioClean = form.portfolio
        .filter((item) => item.title.trim().length > 0)
        .map((item) => ({
          id: item.id,
          title: item.title.trim(),
          url: item.url?.trim() || undefined,
          description: item.description?.trim() || undefined,
        }));

      await updateProfile({
        displayName: form.displayName.trim(),
        handle: form.handle.trim(),
        role: form.role,
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim() || "",
        countryCode: form.countryCode.trim(),
        timezone: form.timezone.trim(),
        skills: form.skills,
        hourlyRateUsdcUnits,
        availability: form.availability === "" ? null : form.availability,
        portfolio: portfolioClean,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={<User size={14} />}
        eyebrow="Profile"
        title="Your account"
        subtitle="Edit your public profile. Wallet address is locked to your signed session."
        actions={
          <Link className="button ghost" href="/dashboard">
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      {completeness ? (
        <section className="panel" style={{ marginBottom: 16 }}>
          <div className="completeness-head">
            <div>
              <h2 className="panel-title">Profile completeness</h2>
              <p className="small muted" style={{ margin: "4px 0 0" }}>
                Complete profiles attract more invitations and faster funding.
              </p>
            </div>
            <span className="completeness-percent">{completeness.percent}%</span>
          </div>
          <div
            className="completeness-bar"
            role="progressbar"
            aria-valuenow={completeness.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="completeness-bar-fill" style={{ width: `${completeness.percent}%` }} />
          </div>
          <ul className="completeness-checklist">
            {completeness.fields.map((field) => (
              <li key={field.key} className={field.filled ? "done" : ""}>
                {field.filled ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                <span>{field.label}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Display name</span>
            <input
              className="input"
              value={form.displayName}
              onChange={(e) => patch("displayName", e.target.value)}
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label className="field">
            <span>Handle</span>
            <input
              className="input"
              value={form.handle}
              onChange={(e) => patch("handle", e.target.value.replace(/\s/g, ""))}
              required
              minLength={3}
              maxLength={48}
              pattern="[a-zA-Z0-9_-]+"
              title="Letters, numbers, dashes, underscores only."
            />
          </label>
          <label className="field">
            <span>Wallet</span>
            <input className="input" value={activeProfile.walletAddress} readOnly />
          </label>
          <label className="field">
            <span>Role</span>
            <select
              className="select"
              value={form.role}
              onChange={(e) => patch("role", e.target.value as EditableRole)}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Availability</span>
            <select
              className="select"
              value={form.availability}
              onChange={(e) => patch("availability", e.target.value as FormState["availability"])}
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.value || "none"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Hourly rate (USDC)</span>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.hourlyRateUsdc}
              onChange={(e) => patch("hourlyRateUsdc", e.target.value)}
              placeholder="e.g. 50"
            />
          </label>
          <label className="field">
            <span>Country code</span>
            <input
              className="input"
              value={form.countryCode}
              onChange={(e) => patch("countryCode", e.target.value)}
              maxLength={8}
              placeholder="ID, US, …"
            />
          </label>
          <label className="field">
            <span>Timezone</span>
            <input
              className="input"
              value={form.timezone}
              onChange={(e) => patch("timezone", e.target.value)}
              maxLength={64}
              placeholder="Asia/Jakarta"
            />
          </label>
          <label className="field span-2">
            <span>Avatar URL</span>
            <input
              className="input"
              value={form.avatarUrl}
              onChange={(e) => patch("avatarUrl", e.target.value)}
              type="url"
              placeholder="https://…"
              maxLength={500}
            />
          </label>
          <label className="field span-2">
            <span>Bio</span>
            <textarea
              className="textarea"
              value={form.bio}
              onChange={(e) => patch("bio", e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Tell clients what you ship and how you work."
            />
          </label>

          <div className="field span-2">
            <span>Skills</span>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                className="input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill and press Enter"
                maxLength={48}
              />
              <button className="button ghost" type="button" onClick={addSkill}>
                <Plus size={14} />
                Add
              </button>
            </div>
            {form.skills.length > 0 ? (
              <div className="tags" style={{ marginTop: 10 }}>
                {form.skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="badge"
                    onClick={() => removeSkill(skill)}
                    title="Remove"
                    style={{ cursor: "pointer" }}
                  >
                    {skill}
                    <X size={12} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="small muted" style={{ margin: "6px 0 0" }}>
                No skills yet. Add a few to improve discovery.
              </p>
            )}
          </div>

          <div className="field span-2">
            <span>Portfolio</span>
            {form.portfolio.length > 0 ? (
              <ul className="portfolio-list" style={{ marginTop: 6 }}>
                {form.portfolio.map((item) => (
                  <li className="portfolio-item" key={item.id}>
                    <span className="portfolio-icon" aria-hidden>
                      <Briefcase size={14} />
                    </span>
                    <div style={{ display: "grid", gap: 6, flex: 1 }}>
                      <input
                        className="input"
                        value={item.title}
                        onChange={(e) => updatePortfolio(item.id, { title: e.target.value })}
                        placeholder="Title"
                        maxLength={160}
                      />
                      <input
                        className="input"
                        type="url"
                        value={item.url ?? ""}
                        onChange={(e) => updatePortfolio(item.id, { url: e.target.value })}
                        placeholder="https://… (optional)"
                      />
                      <textarea
                        className="textarea"
                        value={item.description ?? ""}
                        onChange={(e) => updatePortfolio(item.id, { description: e.target.value })}
                        rows={2}
                        placeholder="Short description (optional)"
                        maxLength={2000}
                      />
                    </div>
                    <button
                      type="button"
                      className="button ghost small"
                      onClick={() => removePortfolio(item.id)}
                      aria-label="Remove portfolio item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted" style={{ margin: "6px 0 0" }}>
                No portfolio items yet.
              </p>
            )}
            <button
              type="button"
              className="button ghost"
              onClick={addPortfolioItem}
              style={{ marginTop: 10 }}
            >
              <Plus size={14} />
              Add portfolio item
            </button>
          </div>
        </div>

        {error ? (
          <p className="small" style={{ color: "var(--danger, #ff7676)", marginTop: 12 }}>
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="small" style={{ color: "var(--success, #6cd6a0)", marginTop: 12 }}>
            Profile updated.
          </p>
        ) : null}

        <div className="actions" style={{ marginTop: 16 }}>
          <button className="button primary" type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </>
  );
}
