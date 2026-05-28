"use client";

import { ArrowLeft, Check, CircleDollarSign, Handshake } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { PageHeader, SkeletonPanel } from "@/components/app-shell";
import { ChainTxLink, EscrowTimeline, JobStatusBadge } from "@/components/job-components";
import { ARC_USDC_GAS_BUFFER_UNITS, formatUsdcUnits } from "@/lib/money";
import { nextOnchainAction, useWorkNet } from "@/lib/store";

export default function FundJobPage() {
  const params = useParams<{ id: string }>();
  const { activeProfile, approveAndFund, createOnchainJob, getJob, setBudget, wallet, isSyncing } = useWorkNet();
  const job = getJob(params.id);

  if (!job) {
    if (isSyncing) return <SkeletonPanel lines={5} />;
    notFound();
  }

  const action = nextOnchainAction(job.status);
  const isClient = activeProfile?.id === job.clientProfileId;
  const hasKnownBalance = wallet.usdcBalanceUnits !== undefined;
  const requiredBalanceUnits = job.budgetUsdcUnits + ARC_USDC_GAS_BUFFER_UNITS;
  const walletBalanceUnits = wallet.usdcBalanceUnits ?? 0;
  const canCoverBudget = !hasKnownBalance || walletBalanceUnits >= requiredBalanceUnits;

  return (
    <>
      <PageHeader
        eyebrow="Fund escrow"
        title={job.title}
        subtitle="Lock USDC into escrow. It's released to the provider when you approve the deliverable."
        actions={
          <Link className="button ghost" href={`/jobs/${job.id}`}>
            <ArrowLeft size={16} />
            Back
          </Link>
        }
      />

      <section className="layout-with-rail">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">{formatUsdcUnits(job.budgetUsdcUnits)} budget</h2>
              <p className="small muted hide-mobile" style={{ margin: "4px 0 0" }}>
                Wallet: {hasKnownBalance ? formatUsdcUnits(walletBalanceUnits) : "Not available"}.
                Required: {formatUsdcUnits(requiredBalanceUnits)} (includes {formatUsdcUnits(ARC_USDC_GAS_BUFFER_UNITS)} for gas).
              </p>
            </div>
            <JobStatusBadge status={job.status} />
          </div>

          {isClient ? (
            <div className="actions" style={{ marginTop: 16 }}>
              {action === "createJob" ? (
                <button className="button" type="button" onClick={() => createOnchainJob(job.id)}>
                  <Handshake size={16} />
                  Start job
                </button>
              ) : null}
              {action === "setBudget" ? (
                <button className="button" type="button" onClick={() => setBudget(job.id)}>
                  <CircleDollarSign size={16} />
                  Set budget
                </button>
              ) : null}
              {action === "fund" ? (
                <button className="button primary" type="button" disabled={!canCoverBudget} onClick={() => approveAndFund(job.id)}>
                  <Check size={16} />
                  Approve and fund
                </button>
              ) : null}
              {!action ? <p className="muted">No funding action is required right now.</p> : null}
              {!canCoverBudget ? (
                <p className="small" style={{ color: "var(--danger)" }}>
                  Your wallet balance is below the budget plus the gas buffer.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="muted">Only the client can fund this escrow.</p>
          )}
        </div>

        <aside className="grid">
          <div className="panel">
            <h2 className="panel-title">Progress</h2>
            <div style={{ marginTop: 14 }}>
              <EscrowTimeline status={job.status} />
            </div>
          </div>
          {(() => {
            const entries: Array<[string, string | undefined]> = [
              ["Job started", job.createTxHash],
              ["Budget set", job.setBudgetTxHash],
              ["USDC approved", job.approveTxHash],
              ["Escrow funded", job.fundTxHash],
            ];
            const completed = entries.filter(([, hash]) => Boolean(hash));
            if (completed.length === 0) return null;
            return (
              <div className="panel">
                <h2 className="panel-title">Activity</h2>
                <div className="activity-list" style={{ marginTop: 12 }}>
                  {completed.slice().reverse().map(([label, txHash]) => (
                    <div className="activity-item" key={label}>
                      <span className="activity-icon">{label.slice(0, 1)}</span>
                      <span>
                        <strong>{label}</strong>
                        <span style={{ display: "block", marginTop: 6 }}>
                          <ChainTxLink txHash={txHash} />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </aside>
      </section>
    </>
  );
}
