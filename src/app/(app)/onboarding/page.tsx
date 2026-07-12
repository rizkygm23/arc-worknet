"use client";

import { ArrowLeft, ArrowRight, Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { dismissOnboarding, needsOnboarding } from "@/lib/onboarding";
import { useWorkNet } from "@/lib/store";
import type { Availability } from "@/lib/types";

type EditableRole = "client" | "worker";

type WizardState = {
  role: EditableRole;
  displayName: string;
  handle: string;
  bio: string;
  skills: string[];
  availability: Availability | "";
  hourlyRateUsdc: string;
};

const ROLE_OPTIONS: { value: EditableRole; label: string; hint: string }[] = [
  { value: "worker", label: "Worker", hint: "I want to find and deliver paid work." },
  { value: "client", label: "Client", hint: "I want to post jobs and hire talent." },
];

const AVAILABILITY_OPTIONS: { value: Availability | ""; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "open", label: "Open to work" },
  { value: "limited", label: "Limited availability" },
  { value: "unavailable", label: "Unavailable" },
];

const STEPS = ["You", "Your craft", "Availability"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { state, activeProfile, updateProfile } = useWorkNet();

  const [step, setStep] = useState(0);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [form, setForm] = useState<WizardState | null>(null);

  const isNewUser = useMemo(() => {
    if (!activeProfile) return false;
    return needsOnboarding(activeProfile);
  }, [activeProfile]);

  useEffect(() => {
    if (activeProfile && !form) {
      setForm({
        role: activeProfile.role === "client" ? "client" : "worker",
        displayName: activeProfile.displayName,
        handle: activeProfile.handle,
        bio: activeProfile.bio,
        skills: [...activeProfile.skills],
        availability: activeProfile.availability ?? "",
        hourlyRateUsdc: activeProfile.hourlyRateUsdcUnits
          ? (activeProfile.hourlyRateUsdcUnits / 1_000_000).toString()
          : "",
      });
    }
  }, [activeProfile, form]);

  const canAdvance = useMemo(() => {
    if (!form) return false;
    if (step === 0) {
      return form.displayName.trim().length >= 2 && form.handle.trim().length >= 3;
    }
    if (step === 1) {
      return form.bio.trim().length > 0 || form.skills.length > 0;
    }
    return true;
  }, [form, step]);

  if (!activeProfile || !form) {
    return (
      <section className="onboarding-shell">
        <div className="onboarding-card">
          <p className="eyebrow">Onboarding</p>
          <h1 className="page-title">Connect a wallet to begin</h1>
          <p className="muted">Use the sidebar to connect a wallet, then we&apos;ll set up your profile.</p>
        </div>
      </section>
    );
  }

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setError(undefined);
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed || !form) return;
    if (!form.skills.includes(trimmed)) {
      update("skills", [...form.skills, trimmed]);
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    if (!form) return;
    update(
      "skills",
      form.skills.filter((s) => s !== skill),
    );
  }

  function handleSkip() {
    dismissOnboarding();
    router.push("/dashboard");
  }

  async function handleFinish() {
    if (!form || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      const hourlyRate = form.hourlyRateUsdc.trim();
      const hourlyRateUsdcUnits = hourlyRate === "" ? null : Math.round(Number(hourlyRate) * 1_000_000);
      if (hourlyRateUsdcUnits !== null && (Number.isNaN(hourlyRateUsdcUnits) || hourlyRateUsdcUnits < 0)) {
        throw new Error("Hourly rate must be a positive number.");
      }

      await updateProfile({
        role: form.role,
        displayName: form.displayName.trim(),
        handle: form.handle.trim(),
        bio: form.bio.trim(),
        skills: form.skills,
        availability: form.availability === "" ? null : form.availability,
        hourlyRateUsdcUnits,
      });

      dismissOnboarding();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
      setSaving(false);
    }
  }

  return (
    <section className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-head">
          <p className="eyebrow">
            Welcome to Arc WorkNet
          </p>
          {!isNewUser ? (
            <button type="button" className="button ghost small" onClick={handleSkip} disabled={saving}>
              Skip for now
            </button>
          ) : null}
        </div>

        <div className="onboarding-steps" aria-label="Progress">
          {STEPS.map((label, idx) => (
            <div
              key={label}
              className={`onboarding-step ${idx === step ? "active" : ""} ${idx < step ? "done" : ""}`}
            >
              <span className="onboarding-step-dot">{idx < step ? <Check size={12} /> : idx + 1}</span>
              <span className="onboarding-step-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="onboarding-body">
          {step === 0 ? (
            <>
              <h1 className="page-title">Tell us who you are</h1>
              <p className="muted" style={{ marginTop: 4 }}>
                This drives how jobs and people get matched to you.
              </p>

              <div className="onboarding-role-grid">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`onboarding-role ${form.role === opt.value ? "selected" : ""}`}
                    onClick={() => update("role", opt.value)}
                    aria-pressed={form.role === opt.value}
                  >
                    <strong>{opt.label}</strong>
                    <span className="small muted">{opt.hint}</span>
                  </button>
                ))}
              </div>

              <div className="form-grid" style={{ marginTop: 16 }}>
                <label className="field">
                  <span>Display name</span>
                  <input
                    className="input"
                    value={form.displayName}
                    onChange={(e) => update("displayName", e.target.value)}
                    minLength={2}
                    maxLength={120}
                    placeholder="Ada Lovelace"
                  />
                </label>
                <label className="field">
                  <span>Handle</span>
                  <input
                    className="input"
                    value={form.handle}
                    onChange={(e) => update("handle", e.target.value.replace(/\s/g, ""))}
                    minLength={3}
                    maxLength={48}
                    pattern="[a-zA-Z0-9_-]+"
                    placeholder="ada"
                  />
                </label>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <h1 className="page-title">What do you do?</h1>
              <p className="muted" style={{ marginTop: 4 }}>
                A short bio and a few skills make your profile discoverable.
              </p>

              <label className="field span-2" style={{ marginTop: 16 }}>
                <span>Bio</span>
                <textarea
                  className="textarea"
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
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
                    placeholder="Add a skill manually and press Enter"
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
                        className="badge primary"
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
                    No skills selected. Click popular skills below or add custom skills.
                  </p>
                )}

                {state.skills.length > 0 ? (
                  <div style={{ marginTop: 16 }}>
                    <span className="small muted" style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Popular Skills (Click to select/deselect):
                    </span>
                    {Object.entries(
                      state.skills.reduce((acc, s) => {
                        acc[s.category] = acc[s.category] || [];
                        acc[s.category].push(s);
                        return acc;
                      }, {} as Record<string, typeof state.skills>)
                    ).map(([category, catSkills]) => (
                      <div key={category} style={{ marginBottom: 12 }}>
                        <span className="small muted" style={{ display: "block", marginBottom: 6, textTransform: "capitalize", fontSize: 11, fontWeight: 600 }}>
                          {category}
                        </span>
                        <div className="tags" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {catSkills.map((s) => {
                            const active = form.skills.some((name) => name.toLowerCase() === s.name.toLowerCase());
                            return (
                              <button
                                key={s.id}
                                type="button"
                                className={active ? "skill-chip active" : "skill-chip"}
                                onClick={() => {
                                  if (active) {
                                    update("skills", form.skills.filter((name) => name.toLowerCase() !== s.name.toLowerCase()));
                                  } else {
                                    if (!form.skills.some((name) => name.toLowerCase() === s.name.toLowerCase())) {
                                      update("skills", [...form.skills, s.name]);
                                    }
                                  }
                                }}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1 className="page-title">Availability & rate</h1>
              <p className="muted" style={{ marginTop: 4 }}>
                Optional, but it helps clients know if you&apos;re open and what to budget.
              </p>

              <div className="form-grid" style={{ marginTop: 16 }}>
                <label className="field">
                  <span>Availability</span>
                  <select
                    className="select"
                    value={form.availability}
                    onChange={(e) => update("availability", e.target.value as WizardState["availability"])}
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
                    onChange={(e) => update("hourlyRateUsdc", e.target.value)}
                    placeholder="e.g. 50"
                  />
                </label>
              </div>

              <p className="small muted" style={{ marginTop: 16 }}>
                You can refine everything later from Settings → Profile.
              </p>
            </>
          ) : null}
        </div>

        {error ? (
          <p className="small" style={{ color: "var(--danger, #ff7676)", marginTop: 12 }}>
            {error}
          </p>
        ) : null}

        <div className="onboarding-foot">
          {step > 0 ? (
            <button
              type="button"
              className="button ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={saving}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="button primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="button primary" onClick={handleFinish} disabled={saving}>
              {saving ? "Saving…" : "Finish setup"}
              <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
