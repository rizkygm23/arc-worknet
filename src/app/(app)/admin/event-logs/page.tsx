"use client";

import { Activity, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { ChainTxLink } from "@/components/job-components";
import { useWorkNet } from "@/lib/store";

export default function AdminEventLogsPage() {
  const { state } = useWorkNet();

  return (
    <>
      <PageHeader
        icon={<ScrollText size={14} />}
        eyebrow="Admin"
        title="Event logs"
        subtitle="Indexed events stay read-only to application users and writable only by the service role in production."
      />

      <section className="panel">
        <div className="activity-list">
          {state.events.map((event) => (
            <div key={event.id} className="activity-item">
              <span className="activity-icon">
                <Activity size={16} />
              </span>
              <span>
                <strong>{event.eventSignature}</strong>
                <span className="small muted" style={{ display: "block", marginTop: 4 }}>
                  Block {event.blockNumber} Log {event.logIndex}
                </span>
                <span style={{ display: "block", marginTop: 8 }}>
                  <ChainTxLink txHash={event.txHash} />
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
