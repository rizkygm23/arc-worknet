# Arc WorkNet UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the *Arc Signature* UI redesign across the whole Arc WorkNet product (landing page + authenticated app + all internal pages).

**Architecture:** Update design tokens first, then global styles, then shared components, then page surfaces in order of user impact. Verify with `npm run typecheck`, `npm run lint`, and `npm run build` after each logical chunk.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS custom properties (`tokens.css`, `globals.css`, `landing.css`), Lucide icons.

---

## File Map

| File | Responsibility |
|------|----------------|
| `tokens.css` | Source of truth for colors, typography, radii, spacing, shadows |
| `src/app/layout.tsx` | Root layout + Google Fonts loading |
| `src/app/globals.css` | Global styles, app shell, components |
| `src/app/landing.css` | Landing page specific styles |
| `src/components/landing.tsx` | Landing page React component |
| `src/components/app-shell.tsx` | Sidebar, mobile nav, wallet panel, notifications, page header |
| `src/components/job-components.tsx` | JobRow, JobStatusBadge, ChainTxLink, timeline, deliverable |
| `src/app/(app)/dashboard/page.tsx` | Dashboard surface |
| `src/app/(app)/jobs/page.tsx` | Jobs marketplace surface |
| `src/app/(app)/jobs/[id]/page.tsx` | Job detail surface |
| `src/app/(app)/wallet/page.tsx` | Wallet surface |
| `src/app/(app)/onboarding/page.tsx` | Onboarding wizard surface |
| `src/app/(app)/workers/page.tsx` | Worker directory |
| `src/app/(app)/workers/[id]/page.tsx` | Worker profile |
| `src/app/(app)/applications/page.tsx` | Applications list |
| `src/app/(app)/agents/page.tsx` | Agents list |
| `src/app/(app)/agents/[id]/page.tsx` | Agent detail |
| `src/app/(app)/settings/profile/page.tsx` | Profile settings |
| `src/app/(app)/settings/agents/new/page.tsx` | New agent form |
| `src/app/(app)/admin/jobs/page.tsx` | Admin jobs |
| `src/app/(app)/admin/users/page.tsx` | Admin users |
| `src/app/(app)/admin/event-logs/page.tsx` | Admin event logs |
| `src/app/(app)/activity/page.tsx` | Activity feed |
| `src/app/(app)/jobs/new/page.tsx` | Create job form |
| `src/app/(app)/jobs/[id]/submit/page.tsx` | Submit deliverable |
| `src/app/(app)/jobs/[id]/review/page.tsx` | Review deliverable |
| `src/app/(app)/jobs/[id]/fund/page.tsx` | Fund escrow |

---

## Verification Commands

Use these after every task that touches code:

```bash
npm run typecheck
npm run lint
```

Use this only after a complete logical chunk (or at the very end) because it is slow:

```bash
npm run build
```

---

## Task 1: Update Design Tokens

**Files:**
- Overwrite: `tokens.css`

- [ ] **Step 1: Replace `tokens.css` with Arc Signature tokens**

```css
/* Arc WorkNet · tokens · Arc Signature · light premium
 * Source: docs/superpowers/specs/2026-07-09-arc-worknet-ui-redesign.md
 */
:root {
  /* ─── Brand & Ink ─── */
  --color-bg: #f9faf6;
  --color-surface: #ffffff;
  --color-surface-2: #f3f4f0;
  --color-surface-3: #e8e9e4;
  --color-text: #151515;
  --color-text-mid: #4a4f4c;
  --color-text-mute: #6e756f;
  --color-border: #e3e5e0;
  --color-border-strong: #caced1;
  --color-hairline: #e8e9e4;

  /* ─── Accent ─── */
  --color-brand: #0f7a3e;
  --color-brand-strong: #0b5c2e;
  --color-on-brand: #ffffff;
  --color-accent-sunset: #0f7a3e;
  --color-accent-sunset-soft: #d4f5e0;
  --color-accent-dusk: #3d05ae;
  --color-accent-twilight: #b9f246;
  --color-accent-breeze: #13544e;
  --color-accent-midnight: #e0e6eb;

  /* ─── Semantic Feedback ─── */
  --color-success: #0f7a3e;
  --color-error: #dc2626;
  --color-warning: #d4a017;
  --color-danger-deep: #b91c1c;
  --color-focus: #0f7a3e;
  --color-info: #4f46e5;

  /* ─── Grayscale ─── */
  --color-gray-900: #151515;
  --color-gray-800: #2a2f2c;
  --color-gray-700: #4a4f4c;
  --color-gray-500: #6e756f;
  --color-gray-400: #a1a8a2;
  --color-gray-100: #e8e9e4;

  /* ─── Elevation & Shadows ─── */
  --shadow-sm: 0 1px 2px rgba(15, 23, 18, 0.04), 0 4px 12px rgba(15, 23, 18, 0.06);
  --shadow-md: 0 8px 24px rgba(15, 23, 18, 0.08);
  --shadow-lg: 0 16px 40px rgba(15, 23, 18, 0.10);

  /* ─── Typography ─── */
  --font-display: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-code: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Display scale */
  --text-display-xl: 64px;
  --text-display-lg: 48px;
  --text-display-md: 32px;
  --text-display-sm: 24px;
  --text-display-xs: 18px;
  --tracking-display-xl: -0.02em;
  --tracking-display-lg: -0.02em;
  --tracking-display-md: -0.02em;
  --tracking-display-sm: -0.01em;

  /* Body */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-md: 18px;
  --text-lg: 24px;
  --text-xl: 32px;
  --text-2xl: 48px;
  --text-display: 48px;

  /* Mono caption */
  --text-caption-mono: 11px;
  --text-caption-mono-sm: 11px;
  --tracking-mono: 0.04em;
  --tracking-mono-sm: 0.04em;

  /* ─── Motion ─── */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-micro: 120ms;
  --dur-short: 200ms;
  --dur-mid: 280ms;
  --dur-long: 400ms;

  /* ─── Geometry ─── */
  --rule-thin: 1px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 9999px;

  /* ─── Spacing (4px scale) ─── */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;
  --space-10: 64px;
  --space-12: 80px;
  --space-14: 96px;
  --space-16: 128px;
}
```

- [ ] **Step 2: Verify no broken references**

```bash
npm run typecheck
```

Expected: PASS (tokens.css is pure CSS).

- [ ] **Step 3: Commit**

```bash
git add tokens.css
git commit -m "design(tokens): apply Arc Signature color, type, shadow, and spacing tokens"
```

---

## Task 2: Load New Fonts in Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import and apply fonts via `next/font/google`**

Replace the contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arc WorkNet",
  description: "USDC-funded job marketplace for human workers and AI agents on Arc.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f9faf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Update `tokens.css` font variables to use CSS variables from layout**

Edit the typography block in `tokens.css`:

```css
  --font-display: var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-body: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-code: var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx tokens.css
git commit -m "feat(layout): load Plus Jakarta Sans, Inter, JetBrains Mono via next/font"
```

---

## Task 3: Update Global Styles

**Files:**
- Modify: `src/app/globals.css`

Goal: map new tokens and restyle base, shell, buttons, cards, forms, badges, tables, toasts, empty states.

- [ ] **Step 1: Update root mapping and base styles**

Replace the top of `src/app/globals.css` (from the `@import` through `::selection`) with:

```css
/* Arc WorkNet · globals · Arc Signature */
@import "../../tokens.css";

:root {
  --bg: var(--color-bg);
  --surface: var(--color-surface);
  --surface-muted: var(--color-surface-2);
  --surface-elevated: var(--color-surface-3);
  --ink: var(--color-text);
  --body: var(--color-text-mid);
  --muted: var(--color-text-mute);
  --line: var(--color-border);
  --line-strong: var(--color-border-strong);
  --hairline: var(--color-hairline);
  --accent: var(--color-brand);
  --accent-strong: var(--color-brand-strong);
  --on-accent: var(--color-on-brand);
  --accent-soft: var(--color-accent-sunset-soft);
  --accent-lime: var(--color-accent-twilight);
  --warning: var(--color-warning);
  --warning-soft: #fbf3d6;
  --danger: var(--color-error);
  --danger-soft: #fde8e8;
  --success: var(--color-success);
  --success-soft: #d4f5e0;
  --info: var(--color-info);
  --shadow: var(--shadow-sm);
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
  margin: 0;
  overflow-x: clip;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.55;
  letter-spacing: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

::selection {
  background: var(--accent);
  color: var(--on-accent);
}

:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 2: Update app shell and sidebar**

Replace the `.app-shell` through `.nav-link.active` blocks with:

```css
/* ─── App shell ─── */
.app-shell {
  display: grid;
  min-height: 100dvh;
  grid-template-columns: 260px minmax(0, 1fr);
}

.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  height: 100dvh;
  flex-direction: column;
  border-right: var(--rule-thin) solid var(--hairline);
  background: var(--bg);
  padding: var(--space-5);
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: var(--rule-thin) solid var(--hairline);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  color: var(--ink);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: var(--on-accent);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
}

.brand-text {
  min-width: 0;
}

.brand-text strong,
.brand-text span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-text strong {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.brand-text span {
  margin-top: 2px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-caption-mono-sm);
  letter-spacing: var(--tracking-mono-sm);
  text-transform: uppercase;
}

.nav {
  display: grid;
  gap: 2px;
  padding: var(--space-5) 0;
}

.nav-link {
  display: flex;
  align-items: center;
  min-height: 40px;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--muted);
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transition:
    background-color var(--dur-short) var(--ease-out),
    color var(--dur-short) var(--ease-out);
}

.nav-link:hover {
  color: var(--ink);
  background: var(--surface-muted);
}

.nav-link.active {
  color: var(--accent);
  background: var(--accent-soft);
  font-weight: 600;
}
```

- [ ] **Step 3: Update sidebar wallet and notifications**

Replace the `.sidebar-footer` through `.notifications-empty` blocks with the refined versions from the design system (compact wallet pill, cleaner notification popover). Key changes:
- `.wallet-mini` uses smaller gaps and mono labels.
- `.wallet-address-pill` height 36px, radius pill.
- `.notifications-button` is 36px circle with hover bg.
- `.notifications-popover` uses new shadow and border colors.

- [ ] **Step 4: Update content, topbar, buttons**

Replace `.content`, `.topbar`, `.eyebrow`, `.page-title`, `.page-subtitle`, `.actions`, `.button`, `.button.primary`, `.button.ghost`, `.button.small`, `.icon-button` with:

```css
.content {
  min-width: 0;
  padding: var(--space-6) var(--space-6) var(--space-10);
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-5);
  border-bottom: var(--rule-thin) solid var(--hairline);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-caption-mono-sm);
  font-weight: 500;
  letter-spacing: var(--tracking-mono-sm);
  text-transform: uppercase;
}

.page-title {
  min-width: 0;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--ink);
  overflow-wrap: anywhere;
}

.page-subtitle {
  max-width: 72ch;
  margin: var(--space-3) 0 0;
  color: var(--body);
  font-size: var(--text-base);
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  border: var(--rule-thin) solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--accent);
  padding: 10px 20px;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  transition:
    background-color var(--dur-short) var(--ease-out),
    border-color var(--dur-short) var(--ease-out),
    color var(--dur-short) var(--ease-out);
}

.button:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

.button:disabled {
  background: var(--surface-muted);
  border-color: var(--line);
  color: var(--muted);
  cursor: not-allowed;
}

.button.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

.button.primary:hover {
  background: var(--accent-strong);
  border-color: var(--accent-strong);
}

.button.ghost {
  border: none;
  background: transparent;
  color: var(--ink);
  font-size: var(--text-sm);
  font-weight: 500;
  padding: 8px 0;
  min-height: unset;
  border-radius: 0;
}

.button.ghost:hover {
  background: transparent;
  text-decoration: underline;
  color: var(--ink);
}

.button.small {
  min-height: 36px;
  padding: 6px 14px;
  font-size: var(--text-sm);
}

.icon-button {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: var(--rule-thin) solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink);
  transition:
    background-color var(--dur-short) var(--ease-out),
    border-color var(--dur-short) var(--ease-out);
}

.icon-button:hover {
  background: var(--surface-muted);
  border-color: var(--line-strong);
}
```

- [ ] **Step 5: Update cards, panels, stats**

Replace `.card`, `.panel`, `.panel-header`, `.panel-title`, `.section-title`, `.stat-grid`, `.stat`, `.metric` with:

```css
.card {
  min-width: 0;
  border: var(--rule-thin) solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  padding: var(--space-5);
  transition:
    box-shadow var(--dur-short) var(--ease-out),
    border-color var(--dur-short) var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--line-strong);
}

.panel {
  min-width: 0;
  border: var(--rule-thin) solid var(--hairline);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.panel-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.section-title {
  margin: 0 0 var(--space-4);
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.stat {
  min-width: 0;
  border: var(--rule-thin) solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  padding: var(--space-5);
}

.stat span,
.metric span {
  display: block;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-caption-mono-sm);
  font-weight: 500;
  letter-spacing: var(--tracking-mono-sm);
  text-transform: uppercase;
}

.stat strong,
.metric strong {
  display: block;
  margin-top: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}
```

- [ ] **Step 6: Update forms, job rows, badges, chips**

Apply the same pattern: use new tokens, tighten spacing, ensure focus rings use brand color/20% opacity.

- [ ] **Step 7: Verify**

```bash
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(styles): restyle globals for Arc Signature (shell, buttons, cards, stats, forms)"
```

---

## Task 4: Refactor App Shell

**Files:**
- Modify: `src/components/app-shell.tsx`

- [ ] **Step 1: Add logo mark and update Sidebar brand**

Update the `Sidebar` component to render a brand mark:

```tsx
<Link href="/jobs" className="brand">
  <span className="brand-mark" aria-hidden>A</span>
  <div className="brand-text">
    <strong>Arc WorkNet</strong>
    <span>Paid outcomes on Arc</span>
  </div>
</Link>
```

- [ ] **Step 2: Update nav link hover/active visuals**

Ensure `nav-link` classes match the new CSS. No JS change needed if class names stay.

- [ ] **Step 3: Compact WalletPanel**

Reduce vertical spacing in `WalletPanel` and use `small` / `icon-button` consistently. Remove verbose labels where redundant.

- [ ] **Step 4: Update PageHeader**

Ensure `PageHeader` renders `eyebrow` with an optional icon prop. Add `icon?: React.ReactNode` to props and render:

```tsx
<p className="eyebrow">{icon}{eyebrow}</p>
```

Update all callers to pass a relevant Lucide icon.

- [ ] **Step 5: Verify**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/app-shell.tsx
git commit -m "feat(shell): add brand mark, compact wallet, and icon-ready page header"
```

---

## Task 5: Update Shared Job Components

**Files:**
- Modify: `src/components/job-components.tsx`

- [ ] **Step 1: Redesign JobRow**

Update the row markup to use the new grid grouping: left (title + tags + actor), center (budget + status), right (save + action). Replace inline style overrides with CSS classes.

- [ ] **Step 2: Update JobStatusBadge**

Ensure badge classes map to the new semantic colors:

```tsx
const statusClass: Record<JobStatus, string> = {
  open: "open",
  assigned: "open",
  onchain_created: "open",
  budget_set: "open",
  funded: "funded",
  submitted: "submitted",
  revision_requested: "revision_requested",
  completed: "completed",
  disputed: "disputed",
  rejected: "rejected",
  cancelled: "cancelled",
  draft: "draft",
};
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/components/job-components.tsx
git commit -m "feat(jobs): redesign JobRow and status badges for Arc Signature"
```

---

## Task 6: Redesign Landing Page

**Files:**
- Modify: `src/components/landing.tsx`
- Modify: `src/app/landing.css`

- [ ] **Step 1: Replace hero section**

Update `Hero` in `landing.tsx`:

- Use one strong headline with brand accent on "USDC".
- Move stats below CTA as a horizontal trust strip.
- Replace the generic 3D illustration with an inline SVG abstract geometric mark in `landing-hero-visual`.

- [ ] **Step 2: Update landing.css for new section spacing and cards**

Key CSS changes:

```css
.landing {
  background: var(--bg);
  color: var(--ink);
}

.landing-section {
  padding: var(--space-12) var(--space-6);
}

.landing-section-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.landing-hero {
  padding-top: var(--space-10);
}

.landing-hero-title {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-5);
}

.landing-hero-title .accent-money {
  color: var(--accent);
}

.landing-hero-sub {
  max-width: 56ch;
  font-size: var(--text-md);
  color: var(--body);
  margin: 0 0 var(--space-6);
}

.landing-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.landing-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
}

.landing-stat {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-caption-mono-sm);
  text-transform: uppercase;
  letter-spacing: var(--tracking-mono-sm);
}
```

- [ ] **Step 3: Add abstract hero SVG**

Create a small inline SVG component in `landing.tsx`:

```tsx
function HeroVisual() {
  return (
    <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="160" cy="160" r="120" stroke="var(--accent)" strokeOpacity="0.15" strokeWidth="1" />
      <circle cx="160" cy="160" r="80" stroke="var(--accent)" strokeOpacity="0.25" strokeWidth="1" />
      <circle cx="160" cy="160" r="40" fill="var(--accent-soft)" />
      <path d="M160 80 L160 240 M80 160 L240 160" stroke="var(--accent)" strokeOpacity="0.2" strokeWidth="1" />
    </svg>
  );
}
```

Render it in the hero visual container.

- [ ] **Step 4: Update Problem, HowItWorks, Marketplace, WhyArc, Teaser, FinalCta, Footer**

Apply new card styles, spacing, and typography. Remove generic 3D images. Use Lucide icons or simple SVG shapes.

- [ ] **Step 5: Verify**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/landing.tsx src/app/landing.css
git commit -m "feat(landing): redesign landing page for Arc Signature"
```

---

## Task 7: Redesign Dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Update PageHeader call**

Pass a `Sparkles` icon in the eyebrow:

```tsx
<PageHeader
  eyebrow="Command center"
  icon={<Sparkles size={14} />}
  title={`Welcome, ${profileLabel}`}
  subtitle="Track escrow, pending approvals, applications, and recent activity in one place."
  actions={...}
/>
```

- [ ] **Step 2: Update stat cards layout**

Keep `StatCard` usage; ensure the grid collapses responsively via CSS. Remove inline `style={{ marginBottom: 16 }}`; use a section class instead.

- [ ] **Step 3: Polish recommendations and active work panels**

Use the new panel/card classes. Ensure `Link` buttons use `button ghost`.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): polish dashboard for Arc Signature"
```

---

## Task 8: Redesign Jobs Page

**Files:**
- Modify: `src/app/(app)/jobs/page.tsx`

- [ ] **Step 1: Update PageHeader**

Pass a `BriefcaseBusiness` icon.

- [ ] **Step 2: Restructure filter bar**

Use a single search input with `radius-xl` and a row of filter chips. Move budget/category/actor/status selects into a secondary `filter-chips` row.

- [ ] **Step 3: Empty state**

Use the shared `EmptyState` component.

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/jobs/page.tsx
git commit -m "feat(jobs): redesign jobs marketplace filter and empty states"
```

---

## Task 9: Redesign Job Detail

**Files:**
- Modify: `src/app/(app)/jobs/[id]/page.tsx`

- [ ] **Step 1: Update PageHeader**

Pass a `FolderOpen` icon.

- [ ] **Step 2: Convert MessagesPanel to bubble chat**

Replace the current list with bubble-style messages. Add CSS classes `.message-bubble`, `.message-bubble-mine`, `.message-bubble-other`.

- [ ] **Step 3: Update EscrowTimeline**

Ensure the timeline uses the new stepper visual from `job-components.tsx`.

- [ ] **Step 4: Update ApplicantCard and transactions panel**

Use new card/panel classes; simplify inline styles.

- [ ] **Step 5: Verify**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/jobs/\[id\]/page.tsx
git commit -m "feat(job-detail): redesign job detail with bubble messages and stepper timeline"
```

---

## Task 10: Redesign Wallet & Onboarding

**Files:**
- Modify: `src/app/(app)/wallet/page.tsx`
- Modify: `src/app/(app)/onboarding/page.tsx`

- [ ] **Step 1: Wallet PageHeader icon**

Pass `Wallet` icon.

- [ ] **Step 2: Wallet balance cards**

Wrap each balance/network item in a `card` instead of `StatCard` grid for a more visual summary.

- [ ] **Step 3: Onboarding stepper**

Update the progress stepper markup to use the new `.stepper` / `.stepper-step` classes.

- [ ] **Step 4: Onboarding role cards**

Ensure role selection cards use the new selected state with `brand-soft` border.

- [ ] **Step 5: Verify**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/wallet/page.tsx src/app/\(app\)/onboarding/page.tsx
git commit -m "feat(wallet,onboarding): redesign wallet and onboarding flows"
```

---

## Task 11: Polish Remaining App Pages

**Files:**
- Modify: `src/app/(app)/workers/page.tsx`
- Modify: `src/app/(app)/workers/[id]/page.tsx`
- Modify: `src/app/(app)/applications/page.tsx`
- Modify: `src/app/(app)/agents/page.tsx`
- Modify: `src/app/(app)/agents/[id]/page.tsx`
- Modify: `src/app/(app)/settings/profile/page.tsx`
- Modify: `src/app/(app)/settings/agents/new/page.tsx`
- Modify: `src/app/(app)/admin/jobs/page.tsx`
- Modify: `src/app/(app)/admin/users/page.tsx`
- Modify: `src/app/(app)/admin/event-logs/page.tsx`
- Modify: `src/app/(app)/activity/page.tsx`
- Modify: `src/app/(app)/jobs/new/page.tsx`
- Modify: `src/app/(app)/jobs/[id]/submit/page.tsx`
- Modify: `src/app/(app)/jobs/[id]/review/page.tsx`
- Modify: `src/app/(app)/jobs/[id]/fund/page.tsx`

- [ ] **Step 1: Consistency pass**

For each page:
- Update `PageHeader` to pass a relevant icon.
- Replace arbitrary inline styles with CSS classes.
- Use `card`, `panel`, `button`, `badge` consistently.
- Ensure tables use `.table` and responsive wrapping.

- [ ] **Step 2: Verify**

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/
git commit -m "feat(app): polish remaining app pages for Arc Signature consistency"
```

---

## Task 12: Responsive, Accessibility, and Final Verification

**Files:**
- Modify as needed: `src/app/globals.css`

- [ ] **Step 1: Mobile bottom bar**

Add `.mobile-bottom-bar` styles and update `MobileNav` in `app-shell.tsx` to render a bottom bar with 4 primary actions, plus a drawer for the rest.

- [ ] **Step 2: Responsive adjustments**

Ensure:
- `.stat-grid` collapses to 2 columns on tablet/mobile.
- `.job-row` becomes a stacked card on mobile.
- Landing typography scales down 20–30% on mobile.
- Sidebar hidden on mobile; bottom bar visible.

- [ ] **Step 3: Accessibility checks**

- Confirm all `<img>` have `alt`.
- Confirm all form inputs have associated `<label>`.
- Confirm focus rings visible.
- Confirm no emoji icons.
- Confirm `prefers-reduced-motion` disables scroll reveal and drawer animations.

- [ ] **Step 4: Final build verification**

```bash
npm run check
```

Expected: PASS (typecheck + lint + build).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/app-shell.tsx
git commit -m "feat(ui): add mobile bottom bar, responsive polish, and accessibility pass"
```

---

## Post-Implementation Handoff

After Task 12:

1. Run `npm run check` one final time.
2. Push branch if requested by user.
3. Summarize changed files and key visual changes.
