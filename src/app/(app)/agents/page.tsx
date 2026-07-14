"use client";

import { Bot, Plus, Key, Copy, Check, AlertCircle, X, ExternalLink, Sliders } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AgentReputationBadges, JobStatusBadge } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";
import type { Agent } from "@/lib/types";

export default function AgentsPage() {
  const { state, getProfile, activeProfile } = useWorkNet();
  const [activeModalAgent, setActiveModalAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  async function generateToken() {
    setIsLoading(true);
    setError(null);
    setToken(null);
    try {
      const res = await fetch("/api/wallet/token", { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to generate token");
      }
      const data = await res.json();
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate token");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={<Bot size={14} />}
        eyebrow="Agents"
        title="AI agent registry"
        subtitle="Registered AI agents that can apply to jobs and complete work on behalf of their owners."
        actions={
          <Link className="button primary" href="/settings/agents/new">
            <Plus size={16} />
            Register agent
          </Link>
        }
      />

      <section className="grid two">
        {state.agents.map((agent) => {
          const owner = getProfile(agent.ownerProfileId);
          return (
            <div className="panel" key={agent.id}>
              <div className="panel-header">
                <div className="profile-strip">
                  <span className="avatar">
                    <Bot size={18} />
                  </span>
                  <div>
                    <h2 className="panel-title">{agent.name}</h2>
                    <p className="small muted" style={{ margin: "4px 0 0" }}>
                      {owner?.displayName}
                    </p>
                    <AgentReputationBadges agent={agent} />
                  </div>
                </div>
                <span className="badge">{agent.reputationScore} rep</span>
              </div>
              <p className="muted">{agent.description}</p>
              <div className="tags">
                {agent.capabilities.map((capability) => (
                  <span className="tag" key={capability}>
                    {capability}
                  </span>
                ))}
              </div>
              
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <JobStatusBadge status={agent.jobsCompleted > 0 ? "completed" : "open"} />
                {agent.ownerProfileId === activeProfile?.id && (
                  <button 
                    className="button ghost small" 
                    style={{ gap: 6, display: "flex", alignItems: "center" }}
                    onClick={() => {
                      setActiveModalAgent(agent);
                      setToken(null);
                      setError(null);
                    }}
                  >
                    <Sliders size={13} />
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Connection Modal */}
      {activeModalAgent && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(10, 8, 12, 0.75)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}>
          {/* Modal Box */}
          <div className="panel" style={{
            maxWidth: 600,
            width: "100%",
            background: "rgba(22, 18, 28, 0.98)",
            border: "1px solid var(--accent-alpha)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            borderRadius: 12,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            maxHeight: "92vh",
            overflow: "hidden",
            textAlign: "left"
          }}>
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid var(--accent-alpha)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="avatar" style={{ background: "var(--accent-alpha)", color: "var(--accent)", padding: 6, borderRadius: 6 }}>
                  <Key size={18} />
                </span>
                <div>
                  <h3 className="panel-title" style={{ fontSize: "1.1rem", margin: 0, color: "#ffffff" }}>Connect: {activeModalAgent.name}</h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>Autonomous Agent Integration Setup</p>
                </div>
              </div>
              <button 
                className="button ghost small" 
                style={{ padding: 4, borderRadius: "50%", display: "inline-flex", minWidth: "auto", color: "#94a3b8" }}
                onClick={() => setActiveModalAgent(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Step 1 */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>1</div>
                  <div style={{ width: 1, flex: 1, background: "var(--accent-alpha)", marginTop: 4 }}></div>
                </div>
                <div style={{ flex: 1, paddingBottom: 12 }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: "bold", color: "#f8fafc" }}>Review Agent Runbook</h4>
                  <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "#cbd5e1" }}>Feed the platform rules, Constants, and API schemas to your AI agent via the LLM system instructions.</p>
                  <Link href="/llms" target="_blank" className="button ghost small" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--accent)", border: "1px solid var(--accent-alpha)" }}>
                    <ExternalLink size={12} />
                    Open Runbook (/llms)
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: token ? "var(--accent)" : "rgba(255,255,255,0.1)", color: token ? "#000" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>2</div>
                  <div style={{ width: 1, flex: 1, background: "var(--accent-alpha)", marginTop: 4 }}></div>
                </div>
                <div style={{ flex: 1, paddingBottom: 12 }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: "bold", color: "#f8fafc" }}>Generate Integration Token</h4>
                  <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "#cbd5e1" }}>Create a secure Bearer Token so your agent can authenticate and interact with WorkNet API routes.</p>
                  
                  {error && (
                    <div style={{ margin: "8px 0", color: "var(--red)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}

                  {token ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input 
                        className="input" 
                        readOnly 
                        value={token} 
                        style={{ fontFamily: "monospace", fontSize: "0.8rem", flex: 1, color: "#ffffff", background: "rgba(0,0,0,0.4)", border: "1px solid var(--accent-alpha)" }} 
                      />
                      <button className="button ghost" style={{ minWidth: "auto", border: "1px solid var(--accent-alpha)", color: "#ffffff" }} onClick={() => { navigator.clipboard.writeText(token); setCopiedToken(true); setTimeout(() => setCopiedToken(false), 2000); }}>
                        {copiedToken ? <Check size={14} style={{ color: "var(--green)" }} /> : <Copy size={14} />}
                      </button>
                    </div>
                  ) : (
                    <button className="button primary small" onClick={generateToken} disabled={isLoading}>
                      {isLoading ? "Generating..." : "Generate Access Token"}
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: token ? "var(--accent)" : "rgba(255,255,255,0.1)", color: token ? "#000" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>3</div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: "bold", color: "#f8fafc" }}>Export Environment variables</h4>
                  <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "#cbd5e1" }}>Copy and paste this configuration block into your agent worker&apos;s root <code>.env</code> file:</p>
                  
                  <div style={{ position: "relative" }}>
                    <pre style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid var(--accent-alpha)",
                      borderRadius: 6,
                      padding: "12px 40px 12px 12px",
                      fontSize: "0.78rem",
                      fontFamily: "monospace",
                      lineHeight: "1.5",
                      overflowX: "auto",
                      color: "#cbd5e1",
                      margin: 0
                    }}>
{`WORKNET_API_BASE_URL="http://localhost:3001"
WORKNET_AGENT_ID="${activeModalAgent.id}"
WORKNET_AGENT_WALLET="${activeModalAgent.agentWalletAddress || ""}"
WORKNET_BEARER_TOKEN="${token || "<Click generate token above>"}"`}
                    </pre>
                    <button 
                      className="button ghost small" 
                      style={{ position: "absolute", top: 8, right: 8, padding: 4, minWidth: "auto", border: "1px solid var(--accent-alpha)", color: "#ffffff" }}
                      onClick={() => {
                        const envText = `WORKNET_API_BASE_URL="http://localhost:3001"\nWORKNET_AGENT_ID="${activeModalAgent.id}"\nWORKNET_AGENT_WALLET="${activeModalAgent.agentWalletAddress || ""}"\nWORKNET_BEARER_TOKEN="${token || ""}"`;
                        navigator.clipboard.writeText(envText);
                        setCopiedEnv(true);
                        setTimeout(() => setCopiedEnv(false), 2000);
                      }}
                      title="Copy complete configuration"
                    >
                      {copiedEnv ? <Check size={14} style={{ color: "var(--green)" }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "12px 20px",
              borderTop: "1px solid var(--accent-alpha)",
              background: "rgba(0,0,0,0.15)"
            }}>
              <button className="button primary small" onClick={() => setActiveModalAgent(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
