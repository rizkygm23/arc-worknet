# Arc WorkNet Landing Page — Detailed Specification

**Status**: Planning document for the public marketing landing page (replaces current `/` redirect).
**Goal**: Convert curious visitors (clients, human freelancers, AI agent builders) into wallet-connected users who understand the value immediately.
**Design Philosophy**: Engineered, precise, confident, slightly cold but trustworthy. Zero AI slop. Think Stripe + early xAI + high-end onchain product. Dark canvas only. Every element earns its place.

## Core Constraints & Rules

- **Theme**: Strict adherence to existing design system (`tokens.css` + `globals.css`).
  - Background: `#0a0a0a`
  - Surfaces: `#191919`, `#1a1c20`
  - Ink: `#ffffff`, `#dadbdf`, `#7d8187`
  - Accent: White primary (`--color-brand`), with careful sunset/orange (`#ff7a17`) and violet (`#7c3aed`) used sparingly for emphasis only.
  - Typography: Inter for body/display, JetBrains Mono (or Geist Mono) for labels, captions, addresses, numbers. Negative tracking on display text.
  - Geometry: 8px radius everywhere, hairline borders (`--rule-thin`), almost no box-shadows. Elevation comes from borders and subtle surface changes.
  - Buttons: Pill-ish or 8px radius. Primary = solid white on dark. Ghost = transparent with hairline.
  - Icons: Lucide only. Keep them small and precise (14-18px mostly).

- **Tone of Voice**:
  - Direct. Slightly technical. No hype words ("revolutionary", "game-changing", "seamless").
  - Prefer "escrow settles in <1 second" over "blazing fast payments".
  - Human + AI agents treated as equals in the marketplace.
  - No motivational fluff. Operator-to-operator language.

- **What to AVOID (AI slop detectors)**:
  - Generic stock hero images or gradient blobs.
  - Fake testimonials with stock photos.
  - Overused words: "empower", "ecosystem", "next-gen", "Web3".
  - Heavy animations or scroll-jacking.
  - Big fake numbers ("Join 50,000 builders").
  - Rainbow gradients, mesh gradients, 3D blobs.
  - Long paragraphs. Short, scannable blocks.

- **Technical**:
  - Server component + client islands only where needed (wallet connect button).
  - Use existing `WalletPill` / connect logic when possible.
  - Keep bundle light. No new heavy libs for landing.
  - Metadata: Title "Arc WorkNet", description focused on USDC escrow + humans + agents.
  - Eventually the landing should allow "Browse jobs" or "Connect wallet" without full onboarding friction.

## Page Structure (Scroll Order)

1. **Navigation** (minimal)
2. **Hero**
3. **Problem / Current State**
4. **How It Works** (3-4 step visual flow)
5. **Two Sides of the Marketplace** (Clients vs Workers)
6. **Why Arc** (technical advantages, concrete)
7. **Reputation & Trust Layer**
8. **Live Marketplace Teaser** (real data or very careful preview)
9. **Final CTA + Footer**

---

## 1. Navigation (Top Bar)

**Behavior**: Fixed or sticky. Dark. Minimal.

Content:
- Left: **Arc WorkNet** (logo wordmark + small Arc chain indicator)
- Center: (optional) anchor links — "How it works", "For clients", "For workers"
- Right:
  - "Browse jobs" → `/jobs` (public)
  - Primary button: "Connect wallet" (triggers Privy / existing connect flow)
  - Or "Enter app" if already connected (detect via client component)

**Style notes**:
- Use existing `.brand` pattern from sidebar but simplified.
- Height ~64px.
- Hairline bottom border.
- On mobile: hamburger that reveals the same actions + anchors.

Copy example:
```
Arc WorkNet          How it works   For clients   For workers     Browse jobs    [Connect]
```

---

## 2. Hero

**Layout**: Full viewport height or ~85vh. Centered or left-heavy with visual on right.

**Headline** (large display, negative tracking):
"Escrow USDC.  
Get work done by humans or agents.  
Settle on Arc."

**Subheadline** (smaller, muted):
A job marketplace where payment is locked onchain before work starts. Humans and AI agents compete on equal terms. Settlement in under a second.

**Primary actions** (two buttons side by side):
- "Post a job" → `/jobs/new` (or connect + redirect)
- "Browse open jobs" → `/jobs`

**Secondary**:
- "Watch 42s demo" (if we have a clean Loom or self-hosted short video later) OR "View on Arcscan" link to contract.

**Visual element on right / background**:
- Not a hero image.
- Option A (preferred): Clean terminal-style or code block showing a real job lifecycle snippet.
- Option B: Minimal abstract representation of escrow flow using the actual status badges and arrows (use the existing `.status-badge` styles).
- Option C: Simple SVG line drawing of the job states (open → funded → submitted → completed) with real USDC amounts.

**Hero stats row** (below headline, small mono labels):
- "<1s finality"
- "USDC native"
- "Humans + Agents"
- "ERC-8004 reputation"

Keep them tiny, uppercase, tracked.

**Important**: The hero must communicate **escrow + speed + dual workforce** in 3 seconds.

---

## 3. Problem Section

Headline: "The old way still sucks."

Three tight columns or cards (use `.panel` or `.card` with hairline):

1. **Slow money**
   Traditional platforms hold funds for 7–30 days. Freelancers wait. Agents can't even participate.

2. **High fees, low trust**
   15-20% platform cuts. Centralized disputes. No portable proof you actually delivered.

3. **AI agents are second-class**
   Most marketplaces don't support autonomous agents as first-class workers. They should be able to take jobs, submit work, and get paid directly.

**Bottom line** (one sentence):
Arc WorkNet moves the money onchain at the start and keeps the marketplace logic offchain until settlement.

---

## 4. How It Works (Most Important Section)

**Headline**: "Work happens in six clear steps."

Use a horizontal or vertical timeline with numbered steps. Use the actual job status language from the app.

Steps (exact):

1. **Client creates a job**  
   Title, brief, acceptance criteria, budget in USDC, deadline. Job goes live as "open".

2. **Worker applies or gets assigned**  
   Humans pitch. Agent owners register their agent and let it apply. Client picks one.

3. **Escrow is funded on Arc**  
   Client approves USDC and funds the ERC-8183 job. Money is locked. Status → "funded".

4. **Work is delivered**  
   Worker submits a URL or file hash + notes. Hash is recorded onchain. Status → "submitted".

5. **Client reviews**  
   (Optional AI draft evaluation available.) Client approves, requests revision, or rejects.

6. **USDC is released**  
   Evaluator calls complete. Money moves to the worker in <1 second. Both sides get updated reputation.

**Visual treatment**:
- Use the existing `JobStatusBadge` styles inline.
- Small arrows between steps.
- Keep copy short. One sentence per step max.
- At the end: "Every state change is either recorded on Arc or synchronized instantly via Supabase Realtime."

**Optional micro-demo**: A non-interactive step-by-step that mirrors a real job row.

---

## 5. For Clients

**Headline**: "Post work. Lock payment. Get results."

Points (in a grid of tight cards):

- Pay only when satisfied. Funds are escrowed before anyone starts.
- Choose between human specialists and AI agents in the same feed.
- Set precise acceptance criteria so there's no ambiguity.
- Get onchain proof of every transaction (visible on Arcscan).
- Low fees. Platform takes a small cut only on successful completion.

**CTA inside section**: "Create your first job"

**Realistic example** (no fake data):
"Need a production-grade smart contract audit + test suite in 5 days. Budget 850 USDC. AI agents and senior auditors can both apply."

---

## 6. For Workers (Humans + AI Agents)

Split into two columns or tabs that feel equal.

**Humans**
- Apply to jobs with a short pitch.
- Get paid the same day work is accepted.
- Build portable reputation that travels across platforms (ERC-8004).
- Your completed jobs and ratings are public and verifiable.

**AI Agents**
- Register an agent wallet + metadata once.
- Agents can discover and apply to jobs programmatically.
- Owners set rules. Agents execute and submit.
- Reputation accrues to the agent identity itself.

**Shared benefits**:
- No platform middleman holding your money.
- Same rules, same pay, same reputation system.

**Tone here**: Respectful to both. No "AI will replace you" or "humans only" vibes.

---

## 7. Why Arc

**Headline**: "Built for this."

Concrete advantages (list or 2x2):

- **Sub-second finality**  
  Arc blocks finalize deterministically. No waiting for confirmations.

- **USDC is the native gas and payment token**  
  No wrapped assets. No bridge drama for the core flow.

- **ERC-8183 job escrow standard**  
  Jobs, budgets, submissions, and settlements follow a shared onchain interface.

- **ERC-8004 identity & reputation**  
  Both humans and agents get portable, verifiable onchain reputation that isn't trapped inside one marketplace.

Mention chain details plainly:
"Arc Testnet (chain ID 5042002). Explorer: testnet.arcscan.app"

Later we can add mainnet when ready. For now be honest that this is the environment where the mechanics are proven.

---

## 8. Reputation & Trust

**Headline**: "Your record travels with you."

Explain (short):
- Completed jobs, success rate, total earned/paid, and client ratings are recorded.
- Badges are derived from real activity (top-rated, repeat client, payment verified, etc.).
- Both human profiles and agent identities carry this data.
- Anyone can verify onchain.

Show small examples of the actual badge components that already exist in the app (`ReputationBadges`).

Avoid fake numbers.

---

## 9. Live Marketplace Teaser

**Careful approach** (important):

Option A (recommended for MVP landing):
- "Open jobs right now" section that actually fetches a few public jobs via the same bootstrap or a lightweight public endpoint.
- If no jobs or in demo, show 2-3 realistic example cards using the same `JobRow` / card styles from the app.
- Each card shows: title, budget, status, category/tags, actor type (human/agent), time left.
- Link "See all open jobs" → `/jobs`

Option B (safer if we don't want public data yet):
- Hardcoded but realistic examples (clearly labeled "Example jobs").
- Still use exact same visual language as the internal job list.

Do **not** invent large "X jobs posted this week" counters unless we have real data.

---

## 10. Final CTA + Footer

**Big closing section**:
"Ready to stop waiting for payments?"

Two buttons:
- Primary: "Connect wallet and browse jobs"
- Ghost: "Post a job"

**Footer** (minimal):
- Links: Docs (if exist), Contract on Arcscan, Twitter/X, GitHub
- Small legal: "Arc WorkNet is an experimental MVP on Arc Testnet. Use at your own risk."
- "Built with Arc, USDC, and onchain escrow standards."

---

## Copy Guidelines (Tone Examples)

Good:
"Funds are locked before work begins."
"Settlement happens when the evaluator calls complete."
"AI agents register once and can take jobs autonomously."

Bad (slop):
"Unlock the future of work."
"Experience frictionless collaboration."
"Join the agentic economy today."

---

## Component & Styling Notes (Implementation)

- Reuse as many classes as possible: `.button`, `.button.primary`, `.button.ghost`, `.panel`, `.card`, `.status-badge`, `.eyebrow`, `.page-title`, `.stat`.
- New landing-specific classes should live in `globals.css` under clear comments (/* Landing page */).
- Use the exact spacing scale from tokens (`--space-6`, `--space-8`, etc.).
- For the "How it works" flow, consider a small React island that re-uses `JobStatusBadge`.
- Wallet connect button should use the same logic as `WalletPanel` / `connectWallet` from store.
- All text should be selectable. No fancy masking.
- Responsive: Stack everything below ~768px. Hero becomes taller or centered.

**Suggested new utility classes** (if needed):
- `.landing-section` (consistent vertical padding)
- `.flow-step`
- `.market-card` (slightly different from internal job-row)
- `.mono-label`

---

## SEO & Metadata

In `layout.tsx` or a dedicated landing layout:
- Title: "Arc WorkNet — USDC escrow jobs for humans and AI agents"
- Description: "Post jobs, escrow USDC on Arc, and settle with human workers or autonomous agents. Sub-second finality."
- Open Graph: Use a clean, minimal social image (we can generate later — no AI slop, just typography + chain reference).

---

## Non-Functional Requirements

- First contentful paint should feel instant.
- No external fonts beyond what's already loaded.
- Keyboard accessible.
- Works without JavaScript for the static reading experience (progressive enhancement for connect button).
- Dark mode only (already the case).

---

## Future Phases (Do Not Build Now)

- Animated job lifecycle demo (nice-to-have later).
- Real-time "X jobs funded in last hour".
- Case studies with actual completed jobs.
- Agent registration CTA for builders.
- Mainnet toggle when Arc mainnet is live.

---

## Implementation Priority Order (When You Build)

1. Hero + nav (with working "Connect" that actually triggers auth)
2. How it works (the heart of the pitch)
3. Problem + Why Arc
4. Clients / Workers sections
5. Reputation teaser
6. Live / example jobs row
7. Final CTA + footer
8. Polish + mobile
9. Replace the current `src/app/page.tsx` redirect

---

**This document is the single source of truth for the landing page content and feel.**  
When implementing, treat every sentence and visual decision as deliberate. The goal is a page that feels like it was made by people who actually ship onchain products — not generated.

---

## Appendix: Exact Phrases We Like

- "Money moves when the work is accepted."
- "Same rules for humans and agents."
- "Escrow first. Work second. Settlement last."
- "Your reputation is an onchain asset."
- "Arc Testnet. USDC. Deterministic finality."

Use these as north stars when writing or editing copy later.
