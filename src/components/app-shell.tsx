"use client";

import clsx from "clsx";
import { Bell, Check, Copy, ExternalLink, LogOut, Menu, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWorkNet, walletBalanceLabel } from "@/lib/store";
import { formatUsdcUnits } from "@/lib/money";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import { formatWalletAddress } from "@/lib/wallet";
import { useReadNotifications } from "@/lib/notifications-read";
import { needsOnboarding, readOnboardingDismissed } from "@/lib/onboarding";
import { readTourDone } from "@/lib/tour";
import { TourOverlay } from "@/components/tour";
import { AddFundsButton } from "@/components/add-funds";

const ARC_EXPLORER_URL = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/workers", label: "Workers" },
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

          <div className="wallet-popover-row">
            <AddFundsButton compact />
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

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diffSec), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
}

function NotificationsBell() {
  const { state, activeProfile } = useWorkNet();
  const { isRead, markRead, markAllRead, hydrated } = useReadNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const items = activeProfile
    ? state.notifications
        .filter((n) => n.profileId === activeProfile.id)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12)
    : [];

  const unreadCount = hydrated
    ? items.filter((n) => !n.readAt && !isRead(n.id)).length
    : 0;

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!activeProfile) return null;

  return (
    <div className="notifications" ref={rootRef} data-tour="notifications">
      <button
        type="button"
        className="notifications-button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
      >
        <Bell size={15} />
        {unreadCount > 0 ? (
          <span className="notifications-badge" aria-hidden>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="notifications-popover" role="dialog" aria-label="Notifications">
          <div className="notifications-popover-head">
            <span className="label">Notifications</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="button ghost small"
                onClick={() => markAllRead(items.map((n) => n.id))}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="notifications-empty">
              <span className="muted small">You&apos;re all caught up.</span>
            </div>
          ) : (
            <ul className="notifications-list">
              {items.map((notification) => {
                const unread = !notification.readAt && !isRead(notification.id);
                const body = (
                  <>
                    <span className="notification-title">
                      {unread ? <span className="notification-dot" aria-hidden /> : null}
                      <strong>{notification.title}</strong>
                    </span>
                    <span className="notification-body small">{notification.body}</span>
                    <span className="notification-time small muted">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </>
                );
                return (
                  <li key={notification.id} className={clsx("notification-item", unread && "unread")}>
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        onClick={() => {
                          markRead(notification.id);
                          setOpen(false);
                        }}
                      >
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => markRead(notification.id)}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <Link href="/jobs" className="brand">
          <div className="brand-text">
            <strong>Arc WorkNet</strong>
            <span>Paid outcomes on Arc</span>
          </div>
        </Link>
        <NotificationsBell />
      </div>

      <nav className="nav" aria-label="Main navigation" data-tour="nav">
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

      <div className="sidebar-footer" data-tour="wallet">
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
              <div className="mobile-drawer-head-actions">
                <NotificationsBell />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
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

function OnboardingGuard() {
  const { activeProfile } = useWorkNet();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!activeProfile) return;
    if (pathname === "/onboarding") return;
    if (!needsOnboarding(activeProfile)) return;
    if (readOnboardingDismissed()) return;
    router.push("/onboarding");
  }, [activeProfile, pathname, router]);

  return null;
}

function TourGate() {
  const { activeProfile } = useWorkNet();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!activeProfile) return;
    if (pathname === "/onboarding") return;
    if (readTourDone()) return;
    // Wait one frame so target elements have laid out.
    const id = window.requestAnimationFrame(() => setShow(true));
    return () => window.cancelAnimationFrame(id);
  }, [activeProfile, pathname]);

  if (!show) return null;
  return <TourOverlay onClose={() => setShow(false)} />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <OnboardingGuard />
      <Sidebar />
      <MobileNav />
      <main className="content">{children}</main>
      <ErrorToast />
      <TourGate />
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

export function SkeletonPanel({ lines = 3 }: { lines?: number }) {
  return (
    <div className="panel" aria-busy="true" aria-live="polite">
      <div className="skeleton-stack">
        <span className="skeleton line line-lg" />
        {Array.from({ length: Math.max(lines - 1, 1) }).map((_, idx) => (
          <span key={idx} className={clsx("skeleton", "line", idx % 2 === 0 ? "line-md" : "line-sm")} />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty empty-rich" role="status">
      {icon ? <span className="empty-icon" aria-hidden>{icon}</span> : null}
      <strong className="empty-title">{title}</strong>
      {description ? <span className="empty-desc">{description}</span> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
