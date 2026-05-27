"use client";

import { Activity, BriefcaseBusiness, CircleDollarSign, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { PageHeader, StatCard } from "@/components/app-shell";
import { useWorkNet, walletBalanceLabel } from "@/lib/store";
import { formatUsdcUnits } from "@/lib/money";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import { formatWalletAddress } from "@/lib/wallet";

const operationalChecks = [
  "Your session is stored securely.",
  "Escrow updates are confirmed on Arc before we update your dashboard.",
  "Gas and escrow funding both use your USDC balance.",
];

export default function WalletPage() {
  const { activeProfile, state, wallet, connectWallet, switchWalletToArc } = useWorkNet();
  const escrowed = state.jobs
    .filter((job) => ["funded", "submitted", "revision_requested"].includes(job.status))
    .reduce((sum, job) => sum + job.budgetUsdcUnits, 0);

  return (
    <>
      <PageHeader
        eyebrow="Wallet"
        title="Arc wallet"
        subtitle="Your balance, network, and escrow at a glance."
        actions={
          <>
            <button className="button primary" type="button" onClick={connectWallet}>
              <Wallet size={16} />
              {wallet.isConnected ? formatWalletAddress(wallet.address) : "Connect wallet"}
            </button>
            <button className="button" type="button" onClick={switchWalletToArc} disabled={!wallet.isConnected}>
              <CircleDollarSign size={16} />
              {wallet.chainId === ARC_TESTNET_CHAIN_ID ? "Arc connected" : "Switch Arc"}
            </button>
          </>
        }
      />

      <section className="stat-grid" style={{ marginBottom: 16 }}>
        <StatCard label="Spendable" value={walletBalanceLabel(wallet)} />
        <StatCard label="Escrowed" value={formatUsdcUnits(escrowed)} />
        <StatCard label="Wallet" value={formatWalletAddress(wallet.address ?? activeProfile?.walletAddress)} />
        <StatCard label="Network" value={wallet.chainId === ARC_TESTNET_CHAIN_ID ? "Arc Testnet" : "Not Arc"} />
      </section>

      <section className="layout-with-rail">
        <div className="grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Escrow actions</h2>
                <p className="small muted" style={{ margin: "4px 0 0" }}>
                  Funding and payout actions appear inside each job.
                </p>
              </div>
            </div>
            <div className="grid two">
              <Link className="button" href="/jobs">
                <BriefcaseBusiness size={16} />
                Jobs
              </Link>
              <Link className="button" href="/activity">
                <Activity size={16} />
                Activity
              </Link>
            </div>
          </div>

          <div className="panel hide-mobile">
            <h2 className="panel-title">How your funds are protected</h2>
            <div className="activity-list" style={{ marginTop: 14 }}>
              {operationalChecks.map((line) => (
                <div key={line} className="activity-item">
                  <span className="activity-icon">
                    <ShieldCheck size={15} />
                  </span>
                  <span className="muted">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="panel">
          <h2 className="panel-title">Balance summary</h2>
          <div className="copy-box" style={{ marginTop: 12 }}>
            Wallet: {activeProfile?.walletAddress ?? wallet.address ?? "Not connected"}
            {"\n"}
            Available: {wallet.usdcBalanceUnits !== undefined ? formatUsdcUnits(wallet.usdcBalanceUnits) : "Not available"}
            {"\n"}
            Escrowed: {formatUsdcUnits(escrowed)}
          </div>
        </aside>
      </section>
    </>
  );
}
