"use client";

import { Bot, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { AgentReputationBadges, JobStatusBadge } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";

export default function AgentsPage() {
  const { state, getProfile } = useWorkNet();

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
              <div style={{ marginTop: 12 }}>
                <JobStatusBadge status={agent.jobsCompleted > 0 ? "completed" : "open"} />
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
