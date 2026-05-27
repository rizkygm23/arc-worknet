"use client";

import { Bot, FileUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { ChainTxLink } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";

export default function ActivityPage() {
  const { state } = useWorkNet();

  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="Activity feed"
        subtitle="Job events, submissions, and payments in one place."
      />

      <section className="panel">
        <div className="activity-list">
          {state.transactions.map((tx) => (
            <div key={tx.id} className="activity-item">
              <span className="activity-icon">
                <Wallet size={16} />
              </span>
              <span>
                <strong>{tx.method}</strong>
                <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                  {tx.blockchain} block {tx.blockNumber ?? "pending"}
                </span>
                <span style={{ display: "block", marginTop: 8 }}>
                  <ChainTxLink txHash={tx.txHash} />
                </span>
              </span>
            </div>
          ))}
          {state.submissions.map((submission) => (
            <div key={submission.id} className="activity-item">
              <span className="activity-icon">
                <FileUp size={16} />
              </span>
              <span>
                <strong>Submission</strong>
                <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                  {submission.deliverableUrl}
                </span>
              </span>
            </div>
          ))}
          {state.aiEvaluations.map((evaluation) => (
            <div key={evaluation.id} className="activity-item">
              <span className="activity-icon">
                <Bot size={16} />
              </span>
              <span>
                <strong>AI evaluation</strong>
                <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                  {evaluation.model} scored {evaluation.score}/100
                </span>
              </span>
            </div>
          ))}
          {state.transactions.length === 0 && state.submissions.length === 0 ? (
            <div className="empty">No activity yet.</div>
          ) : null}
        </div>
      </section>
    </>
  );
}
