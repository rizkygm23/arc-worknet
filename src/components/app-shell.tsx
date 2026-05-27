"use client";

import clsx from "clsx";
import { Check, Copy, ExternalLink, LogOut, Menu, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useWorkNet, walletBalanceLabel } from "@/lib/store";
import { formatUsdcUnits } from "@/lib/money";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import { formatWalletAddress } from "@/lib/wallet";

const ARC_EXPLORER_URL = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/agents", label: "Agents" },
  { href: "/wallet", label: "Wallet" },
  { href: "/activity", label: "Activity" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/admin/jobs", label: "Admin" },
];

function WalletPanel() {
  const {
    activeProfile,
    state,
    wallet,
    walletError,
    isWalletPending,
    connectWallet,
    disconnectWallet,
    switchWalletToArc,
    setActiveProfile,
  } = useWorkNet();

  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const escrowed = state.jobs
    .filter((job) => ["funded", "submitted", "revision_requested"].includes(job.status))
    .reduce((sum, job) => sum + job.budgetUsdcUnits, 0);

  const wrongChain = wallet.isConnected && wallet.chainId !== ARC_TESTNET_CHAIN_ID;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const copyAddress = async () => {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
    } catch {
      // ignore
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="wallet-mini">
        <span className="label">Wallet</span>
        <button
          className="button primary"
          type="button"
          onClick={connectWallet}
          disabled={isWalletPending}
        >
          {isWalletPending ? <span className="spinner" aria-hidden /> : <Wallet size={14} />}
          {isWalletPending ? "Connecting…" : "Connect"}
        </button>
        <span className="muted small">Email, Google, or external wallet.</span>
      </div>
    );
  }

  return (
    <div className="wallet-mini">
      {wrongChain ? (
        <div className="wallet-banner">
          <span className="label">Network mismatch</span>
          <button className="button small" type="button" onClick={switchWalletToArc}>
            Switch to Arc Testnet
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="wallet-address-pill"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="wallet-dot" aria-hidden />
        <span className="wallet-address-mono">{formatWalletAddress(wallet.address)}</span>
        <span className="wallet-balance-inline">{walletBalanceLabel(wallet)}</span>
      </button>

      {open ? (
        <div className="wallet-popover" role="dialog" aria-label="Wallet details">
          <div className="wallet-popover-row">
            <span className="label">Address</span>
            <span className="wallet-address-mono full">{wallet.address}</span>
            <div className="wallet-popover-actions">
              <button
                className="button ghost small"
                type="button"
                onClick={copyAddress}
                aria-label="Copy address"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                className="button ghost small"
                href={`${ARC_EXPLORER_URL}/address/${wallet.address}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={12} />
                Explorer
              </a>
            </div>
          </div>

          <div className="wallet-stat">
            <span>Network</span>
            <strong>{wrongChain ? "Wrong network" : "Arc Testnet"}</strong>
          </div>
          <div className="wallet-stat">
            <span>Balance</span>
            <strong>{walletBalanceLabel(wallet)}</strong>
          </div>
          <div className="wallet-stat">
            <span>Escrowed</span>
            <strong>{formatUsdcUnits(escrowed)}</strong>
          </div>

          {state.profiles.length > 1 ? (
            <div className="wallet-popover-row">
              <span className="label">Active profile</span>
              <select
                className="select"
                value={activeProfile?.id ?? ""}
                onChange={(event) => setActiveProfile(event.target.value)}
                aria-label="Switch active profile"
              >
                {state.profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.displayName} ({profile.role})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <button
            className="button ghost small"
            type="button"
            onClick={disconnectWallet}
            style={{ justifyContent: "flex-start" }}
          >
            <LogOut size={12} />
            Disconnect
          </button>
        </div>
      ) : null}

      {walletError ? (
        <div className="wallet-error" role="alert">
          {walletError}
        </div>
      ) : null}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/jobs" className="brand">
        <div className="brand-text">
          <strong>Arc WorkNet</strong>
          <span>Paid outcomes on Arc</span>
        </div>
      </Link>

      <nav className="nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/jobs" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={clsx("nav-link", active && "active")}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <WalletPanel />
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="mobile-bar">
        <Link href="/jobs" className="mobile-brand" aria-label="Arc WorkNet home">
          Arc WorkNet
        </Link>
        <button
          type="button"
          className="icon-button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </header>

      {open ? (
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="mobile-drawer-backdrop" onClick={() => setOpen(false)} />
          <div className="mobile-drawer-panel">
            <div className="mobile-drawer-head">
              <strong>Arc WorkNet</strong>
              <button
                type="button"
                className="icon-button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mobile-drawer-nav" aria-label="Main navigation">
              {navItems.map((item) => {
                const active =
                  pathname === item.href || (item.href !== "/jobs" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx("nav-link", active && "active")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mobile-drawer-foot">
              <WalletPanel />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ErrorToast() {
  const { walletError, backendError } = useWorkNet();
  const [dismissed, setDismissed] = useState<string | undefined>(undefined);
  const message = walletError ?? backendError;

  useEffect(() => {
    if (message !== dismissed) setDismissed(undefined);
  }, [message, dismissed]);

  if (!message || message === dismissed) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      <div className="toast error">
        <span className="toast-label">Error</span>
        <span>{message}</span>
        <button
          className="button ghost small"
          type="button"
          onClick={() => setDismissed(message)}
          style={{ justifySelf: "flex-end", marginTop: 4 }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <MobileNav />
      <main className="content">{children}</main>
      <ErrorToast />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle hide-mobile">{subtitle}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {icon ? <div className="muted small" style={{ marginTop: 10 }}>{icon}</div> : null}
    </div>
  );
}

export function WalletPill() {
  const { activeProfile, wallet } = useWorkNet();
  return (
    <span className="chip hide-mobile">
      <Wallet size={12} />
      {formatWalletAddress(activeProfile?.walletAddress ?? wallet.address)}
    </span>
  );
}
