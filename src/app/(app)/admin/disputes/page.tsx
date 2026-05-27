"use client";

import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export default function AdminDisputesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Disputes"
        subtitle="Full dispute arbitration is explicitly out of scope for the MVP."
      />

      <section className="panel">
        <div className="empty">
          <div>
            <ShieldAlert size={28} />
            <p>Dispute workflow is reserved for the custom contract phase.</p>
          </div>
        </div>
      </section>
    </>
  );
}
