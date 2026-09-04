"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, ShieldCheck, Scale } from "lucide-react";
import { useWorkNet } from "@/lib/store";
import { formatUsdc } from "@/lib/money";

export default function DisputeWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { state } = useWorkNet();
  const job = state.jobs.find((j) => j.id === id);

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<"revision" | "penalty">("revision");

  if (!job) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Job Not Found</h2>
        <Link href="/jobs" className="mt-4 text-blue-500 hover:underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const budget = job.budgetUsdcUnits || 0;
  const penalty5Percent = Math.floor(budget * 0.05);
  const refund95Percent = budget - penalty5Percent;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href={`/jobs/${id}`}
          className="p-2 border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Dispute Resolution Workspace</h1>
          <p className="text-sm text-neutral-500">
            ERC-8183 Onchain Mediation for Job #{job.id.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40">
        <div>
          <span className="text-xs uppercase text-neutral-400 font-bold">Job Title</span>
          <p className="font-semibold">{job.title}</p>
        </div>
        <div>
          <span className="text-xs uppercase text-neutral-400 font-bold">Escrow Budget</span>
          <p className="font-semibold">{formatUsdc(budget)} USDC</p>
        </div>
        <div>
          <span className="text-xs uppercase text-neutral-400 font-bold">Current Status</span>
          <span className="inline-block px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {job.status}
          </span>
        </div>
      </div>

      {/* Mediation Options */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-500" />
          Choose Mediation Resolution
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setActionType("revision")}
            className={`p-5 rounded-2xl border text-left transition ${
              actionType === "revision"
                ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500"
                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
            }`}
          >
            <ShieldCheck className="w-6 h-6 text-blue-500 mb-2" />
            <h3 className="font-bold">Request Revision</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Give the worker an opportunity to revise their deliverable based on detailed feedback without losing funds.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActionType("penalty")}
            className={`p-5 rounded-2xl border text-left transition ${
              actionType === "penalty"
                ? "border-red-500 bg-red-50/20 dark:bg-red-950/20 ring-2 ring-red-500"
                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
            }`}
          >
            <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
            <h3 className="font-bold">Reject with 5% Penalty</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Trustless rejection on Arc. Client is refunded 95% ({formatUsdc(refund95Percent)} USDC) and worker receives 5% ({formatUsdc(penalty5Percent)} USDC).
            </p>
          </button>
        </div>
      </div>

      {/* Reason and Submission */}
      <div className="border p-6 rounded-2xl space-y-4 bg-card">
        <h3 className="font-bold">Mediation Statement & Justification</h3>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="State the exact defects, missing criteria, or justification for this action..."
          className="w-full p-3 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href={`/jobs/${id}`}
            className="px-4 py-2 text-sm font-semibold rounded-xl border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={!reason.trim() || submitting}
            onClick={() => setSubmitting(true)}
            className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl disabled:opacity-50 hover:bg-primary/90 transition shadow"
          >
            {submitting ? "Processing..." : "Confirm & Execute Onchain"}
          </button>
        </div>
      </div>
    </div>
  );
}
