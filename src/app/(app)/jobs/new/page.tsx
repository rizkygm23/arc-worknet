"use client";

import { ArrowLeft, PlusCircle, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { usdcUnitsFromInput } from "@/lib/money";
import { useWorkNet } from "@/lib/store";
import type { ActorType } from "@/lib/types";

export default function NewJobPage() {
  const router = useRouter();
  const { state, activeProfile, createJob, connectWallet } = useWorkNet();
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [deliverableFormat, setDeliverableFormat] = useState("Pull request URL");
  const [category, setCategory] = useState("Engineering");
  const [tags, setTags] = useState("Arc, USDC");
  const [budget, setBudget] = useState("250");
  const [deadline, setDeadline] = useState("");
  const [actorType, setActorType] = useState<ActorType>("human");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);
    try {
      const jobId = await createJob({
        title,
        brief,
        acceptanceCriteria,
        deliverableFormat,
        category,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        budgetUsdcUnits: usdcUnitsFromInput(budget),
        deadlineAt: deadline ? new Date(deadline).toISOString() : undefined,
        actorType,
      });
      router.push(`/jobs/${jobId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create job.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={<PlusCircle size={14} />}
        eyebrow="Create job"
        title="Define a paid outcome"
        subtitle="Public marketplace jobs stay offchain until a provider is selected. Budgets are stored as integer USDC base units."
        actions={
          <Link className="button ghost" href="/jobs">
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      <form className="panel" onSubmit={onSubmit}>
        {!activeProfile ? (
          <div className="empty" style={{ marginBottom: 16 }}>
            <div>
              <p>Connect a wallet before creating a production job.</p>
              <button className="button primary" type="button" onClick={connectWallet}>
                Connect wallet
              </button>
            </div>
          </div>
        ) : null}
        {error ? <div className="empty" style={{ marginBottom: 16 }}>{error}</div> : null}
        <div className="form-grid">
          <label className="field span-2">
            <span>Title</span>
            <input
              className="input"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Implement deterministic Arc event indexer"
            />
          </label>

          <label className="field span-2">
            <span>Brief</span>
            <textarea
              className="textarea"
              required
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Describe the outcome, constraints, context, and expected implementation surface."
            />
          </label>

          <label className="field span-2">
            <span>Acceptance criteria</span>
            <textarea
              className="textarea"
              required
              value={acceptanceCriteria}
              onChange={(event) => setAcceptanceCriteria(event.target.value)}
              placeholder="List the checks a reviewer will use before releasing escrow."
            />
          </label>

          <label className="field">
            <span>Deliverable format</span>
            <input
              className="input"
              value={deliverableFormat}
              onChange={(event) => setDeliverableFormat(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Category</span>
            <input className="input" value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>

          <label className="field">
            <span>Budget</span>
            <input
              className="input"
              type="number"
              min="0.001"
              step="any"
              required
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Deadline</span>
            <input
              className="input"
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Provider type</span>
            <select className="select" value={actorType} onChange={(event) => setActorType(event.target.value as ActorType)}>
              <option value="human">Human worker</option>
              <option value="agent">AI agent</option>
            </select>
          </label>

          <div className="field span-2">
            <span>Tags (Required Skills)</span>
            <input
              className="input"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="e.g. React, Next.js, Solidity"
            />
            {state.skills.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <span className="small muted" style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Popular Skills (Click to add/remove as required tags):
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
                        const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
                        const active = tagsArray.some((t) => t.toLowerCase() === s.name.toLowerCase());
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className={active ? "skill-chip active" : "skill-chip"}
                            onClick={() => {
                              if (active) {
                                const filtered = tagsArray.filter((t) => t.toLowerCase() !== s.name.toLowerCase());
                                setTags(filtered.join(", "));
                              } else {
                                const updated = [...tagsArray, s.name];
                                setTags(updated.join(", "));
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
        </div>

        <div className="actions" style={{ marginTop: 18 }}>
          <button className="button primary" type="submit" disabled={isSaving || !activeProfile}>
            <Save size={16} />
            Create job
          </button>
        </div>
      </form>
    </>
  );
}
