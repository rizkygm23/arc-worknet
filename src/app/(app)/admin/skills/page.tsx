"use client";

import { useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { apiJson, useWorkNetData } from "@/lib/store";

type SkillRow = {
  id: string;
  name: string;
  category: string;
};

export default function AdminSkillsPage() {
  const { state, activeProfile, refreshState } = useWorkNetData();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = activeProfile?.role === "admin";

  async function submitNew() {
    if (!name.trim() || !category.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson("/api/skills", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), category: category.trim() }),
      });
      setName("");
      setCategory("");
      await refreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add skill.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(skill: SkillRow) {
    setEditingId(skill.id);
    setEditName(skill.name);
    setEditCategory(skill.category);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditCategory("");
  }

  async function submitEdit() {
    if (!editingId || !editName.trim() || !editCategory.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson("/api/skills", {
        method: "PATCH",
        body: JSON.stringify({ id: editingId, name: editName.trim(), category: editCategory.trim() }),
      });
      cancelEdit();
      await refreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(skill: SkillRow) {
    setBusy(true);
    setError(null);
    try {
      await apiJson("/api/skills", {
        method: "DELETE",
        body: JSON.stringify({ id: skill.id }),
      });
      await refreshState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={<ShieldCheck size={14} />}
        eyebrow="Admin"
        title="Skills master"
        subtitle="Master list of skills available to workers and agent capabilities. Changes apply platform-wide."
      />

      {!isAdmin ? (
        <section className="panel">
          <p className="muted">Admin access required.</p>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2 className="section-title">{editingId ? "Edit skill" : "Add skill"}</h2>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="skill-name">Name</label>
                <input
                  id="skill-name"
                  className="input"
                  value={editingId ? editName : name}
                  onChange={(e) => (editingId ? setEditName(e.target.value) : setName(e.target.value))}
                  placeholder="e.g. solidity"
                  maxLength={48}
                />
              </div>
              <div className="field">
                <label htmlFor="skill-category">Category</label>
                <input
                  id="skill-category"
                  className="input"
                  value={editingId ? editCategory : category}
                  onChange={(e) => (editingId ? setEditCategory(e.target.value) : setCategory(e.target.value))}
                  placeholder="e.g. development"
                  maxLength={48}
                />
              </div>
            </div>
            <div className="actions" style={{ justifyContent: "flex-start", marginTop: "var(--space-4)" }}>
              {editingId ? (
                <>
                  <button className="button primary small" type="button" disabled={busy} onClick={submitEdit}>
                    Save changes
                  </button>
                  <button className="button small" type="button" disabled={busy} onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="button primary small"
                  type="button"
                  disabled={busy || !name.trim() || !category.trim()}
                  onClick={submitNew}
                >
                  <Plus size={14} /> Add skill
                </button>
              )}
            </div>
            {error ? <p className="wallet-error" style={{ marginTop: "var(--space-4)" }}>{error}</p> : null}
          </section>

          <section className="panel">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.skills.map((skill) => (
                    <tr key={skill.id}>
                      <td>
                        <strong>{skill.name}</strong>
                      </td>
                      <td>{skill.category}</td>
                      <td>
                        <div className="actions" style={{ gap: "var(--space-2)" }}>
                          <button
                            className="button small"
                            type="button"
                            disabled={busy}
                            onClick={() => startEdit(skill)}
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            className="button small"
                            type="button"
                            disabled={busy}
                            onClick={() => remove(skill)}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {state.skills.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="muted">
                        No skills yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
