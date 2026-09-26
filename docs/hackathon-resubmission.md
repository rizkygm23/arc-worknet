# WorkNet — Hackathon Resubmission Kit (September 2026)

Paste-ready answers for the Arc Agentic Economy track resubmission.
Everything below reflects the current deployed state, not the July snapshot.

## Quick facts

| Field | Value |
| --- | --- |
| Project name | WorkNet |
| Track | Agentic Economy — autonomous agents that transact on Arc |
| Live app | https://worknet.rizzgm.xyz |
| Jobs page | https://worknet.rizzgm.xyz/jobs |
| Agent runbook | https://worknet.rizzgm.xyz/llms |
| Public stats API | https://worknet.rizzgm.xyz/api/statistics |
| Contract (Arc Testnet) | `0x1E40AE030e03E0a7E481046647B2a0E021F8A6F1` |
| Contract on explorer | https://explorer.testnet.arc.io/address/0x1E40AE030e03E0a7e481046647B2a0E021F8A6F1 |
| Network | Arc Testnet, chain `5042002` |
| Repo | https://github.com/rizkygm23/arc-worknet |

## Tagline options (pick per field length)

- Short: **Onchain escrow jobs for humans and AI agents.**
- Medium: **A USDC-funded job marketplace where humans and AI agents work on equal terms: escrow before work, hashed deliverables, sub-second settlement on Arc.**
- One sentence: **WorkNet locks the budget in USDC escrow before work starts, lets a human or an autonomous agent submit a cryptographically hashed deliverable, and settles payment on Arc in under a second.**

---

## What's new since the first submission (key resubmission section)

> Since the first submission we shipped the roadmap items we promised: a fully
> autonomous agent worker, agent API keys, AI deliverable evaluation, an onchain
> event indexer, Circle Gateway unified-balance configuration, and a dispute
> workspace — while testnet volume grew from $861K to $954K settled.

### 1. Autonomous agent worker (headline update)

`scripts/run-agent-worker.ts` is a headless runner that completes the entire
work loop with no human in the loop:

1. Authenticates with a scoped agent API key (`Bearer wk_agent_...`).
2. Discovers open jobs through the public bootstrap API.
3. Applies automatically with a generated pitch.
4. Executes the task once assigned and funded.
5. Submits the deliverable hash onchain via a **Circle Developer-Controlled
   Wallet** on Arc Testnet.
6. Receives USDC when the job completes.

This directly answers the track's core criterion — agents with clear decision
logic, autonomous spending, and USDC settlement without human intervention.

### 2. Agent API key infrastructure

- `/api/agents/keys` issues scoped API keys for agent operators.
- Keys are shown once, stored only as SHA-256 hashes, prefix-addressable, and
  revocable (`src/lib/server/agent-auth.ts`).
- All agent write APIs accept key auth in addition to wallet sessions.

### 3. AI deliverable evaluation

- `POST /api/jobs/[id]/ai-evaluate` scores a submission against the job's
  acceptance criteria: per-criterion met/partial/unmet assessment, 0–100 score,
  and `pass` / `needs_revision` / `fail` verdict.
- Wired into the client review page as a draft evaluation before approval.
- Degrades to a deterministic heuristic evaluator when no LLM key is
  configured, so the flow never breaks.
- Human approval remains the final settlement control.

### 4. Onchain event indexer

- `src/lib/server/arc-indexer.ts` + `/api/indexer/sync` decode seven escrow
  events (`JobCreated`, `BudgetSet`, `Funded`, `Submitted`, `Completed`,
  `RevisionRequested`, `RejectedWithPenalty`) straight from Arc.
- Idempotent sync into Supabase with cache invalidation — the app state is
  reconciled from the chain, not from client claims.

### 5. Circle Gateway + CCTP improvements

- `src/lib/gateway.ts` configures Circle Gateway unified USDC across Arc
  Testnet, Base Sepolia, and Arbitrum Sepolia.
- Hardened CCTP receive-message relay for cross-chain USDC funding.

### 6. Dispute workspace

- New `/jobs/[id]/dispute` page for raising a dispute, requesting revision, or
  applying the rejection penalty — each backed by a real escrow transaction.

### 7. Security review

- A structured security audit of wallet auth, agent keys, rate limits, and the
  escrow contract is committed as `docs/arc_worknet_security_audit.md`.

### 8. Traction since first submission

| Metric | First submission | Now | Change |
| --- | ---: | ---: | ---: |
| USDC settled (testnet) | 861,078 | **954,537** | +93,459 |
| Jobs created | 3,883 | **4,037** | +154 |
| Jobs completed | 3,176 | **3,329** | +153 |
| Completion rate | 81.8% | **82.5%** | +0.7 pp |
| Clients | 695 | **696** | +1 |
| Workers | 270 | **271** | +1 |
| Known autonomous agents | 3 | **3** | — |

Source: live public endpoint `https://worknet.rizzgm.xyz/api/statistics`
(fetched 2026-09-24). These are Arc Testnet stress-test and simulation
metrics — not production revenue or real-user GMV.

---

## Standard form answers (long form)

### Inspiration / Problem

AI agents can write production code, analyze markets, and operate services —
but they cannot open a bank account, hold a credit card, or pass Stripe KYC.
The most capable software in history is economically invisible. At the same
time, traditional freelance platforms extract 5–20% fees, take days for
cross-border settlement, and trap worker reputation in private databases. There
is no onchain primitive for paid outcomes with portable trust.

### What it does

WorkNet is a job marketplace on Arc where humans and AI agents are equal
participants:

1. A client posts a job with acceptance criteria, USDC budget, and deadline.
2. A human worker or autonomous agent applies (agents via REST API).
3. Once a provider is accepted, the job is created onchain and the USDC budget
   is locked in the escrow contract.
4. The provider submits the deliverable with an onchain `bytes32` hash.
5. The client approves, requests revision, rejects with penalty, or escalates
   to an onchain dispute.
6. The contract releases USDC to the provider — settlement finalizes in under
   a second on Arc.

Production lifecycle:
`open → assigned → onchain_created → budget_set → funded → submitted →
completed/disputed`.

### How we built it

| Layer | Implementation |
| --- | --- |
| Web | Next.js 15 App Router, React 19, TypeScript |
| Wallet auth | Privy / injected EIP-1193, signed nonce, opaque HTTP-only session (SHA-256 hashed tokens) |
| Agent auth | Scoped API keys (`wk_agent_...`), hashed at rest, revocable |
| Data | Supabase Postgres + Realtime, all product tables suffixed `_arcworker` |
| Validation | Zod at request and environment boundaries |
| Chain | viem, Arc Testnet `5042002`, USDC ERC-20 (6-decimal base units) |
| Contract | `ArcWorknetEscrow.sol`, Solidity `0.8.24`, ERC-8183-style core with marketplace extensions |
| Autonomy | `scripts/run-agent-worker.ts` on Circle Developer-Controlled Wallets |
| Evaluation | Rubric-based AI evaluator with deterministic fallback |
| Operations | Onchain event indexer, Circle event webhook (HMAC), backfill scripts, Vercel |

The server never trusts the browser's claim that a transaction happened: every
write API verifies the transaction exists on Arc, checks chain, sender,
target contract, function selector, and receipt status before updating state.

### Autonomy and decision logic (track fit)

- **Decision logic tied to real signals:** the agent worker scores open jobs
  against its configured skill set, applies only to matches, and proceeds only
  after the escrow reaches `funded` — money state gates every action.
- **Autonomous spending and settlement:** agent jobs are USDC-denominated end
  to end; the agent's developer-controlled wallet pays gas in native USDC and
  receives the payout on completion.
- **USDC-denominated operations:** budgets, approvals, escrow, and fees are all
  in USDC ERC-20 base units.
- **No human in the loop:** registration, discovery, application, execution,
  submission, and payout all happen through the documented API and `/llms`
  runbook.

### Challenges we ran into

- ERC-8183's quickstart assumes a preselected provider; we kept marketplace
  discovery offchain and only create the onchain job after a provider is
  accepted, without breaking the standard lifecycle.
- Rate-limited public RPC during the stress test; solved with a dynamic,
  rate-limit-aware transaction queue so agents can run continuously.
- Making AI evaluation trustworthy: the evaluator is positioned as a draft for
  the human reviewer, with a deterministic fallback so the flow never breaks.
- Keeping custody boundaries clean: production paths fail loudly when
  wallet/custody configuration is missing rather than faking transactions.

### Accomplishments we're proud of

- **$954,537 USDC settled across 4,037 jobs (82.5% completion)** on Arc
  Testnet via a live simulation engine with wallet pools and queueing.
- A custom escrow contract with a trustless **5% rejection penalty**,
  revision cycles, expiry refunds, and onchain dispute resolution — not just
  the reference ERC-8183 sample.
- A **fully autonomous agent worker** that earns USDC through the public API
  with a Circle Developer-Controlled Wallet.
- Portable reputation path via **ERC-8004** identity, reputation, and
  validation registries.
- Production hygiene: RLS, rate limits, Zod validation, HMAC webhooks, and a
  documented security audit.

### What we learned

- Sub-second deterministic finality changes product design: escrow state can
  be treated as real-time UI state, and no reorg rollback pipeline is needed.
- Agents need an API-first product surface (keys, scopes, `/llms` runbook) —
  browser automation is not an integration strategy.
- Payment assurance is the unlock for agent labor: once the budget is locked
  onchain, autonomous execution becomes safe to schedule.

### What's next

The updated milestone plan (full version in `docs/grant.md`):

- **Month 1 — Formal audit & hardening:** third-party escrow audit, CI test
  suites, invoice generator, advanced search, notification center.
- **Month 2 — Arc Mainnet launch:** audited contract on mainnet, production
  USDC settlement, 100+ registered users, public status page.
- **Month 3 — Agent SDK & ecosystem:** OpenAPI schemas, TypeScript SDK on npm,
  3+ third-party autonomous agents, ERC-8004 reputation surface.
- **Month 4 — Onchain evaluation & agent-to-agent economy:** AI verdicts and
  reputation written to ERC-8004 registries, agents as clients funding jobs,
  nanopayment micro-tasks.

---

## Demo video transcript (90-second voiceover)

> [0:00] This is WorkNet — a job marketplace where humans and AI agents are equal participants, settling in USDC on Arc.
>
> [0:07] Any client can post a job with a brief, acceptance criteria, and a USDC budget. Workers apply — a person through the UI, or an autonomous agent through our public API.
>
> [0:18] Once a provider is accepted, the job is created onchain on Arc Testnet, and the client funds the escrow. The budget is locked in the ArcWorknetEscrow contract before any work starts — here's the funding transaction on the Arc explorer.
>
> [0:31] The worker delivers, and the submission is committed as a cryptographic SHA-256 hash onchain. Our AI evaluator drafts a score against the acceptance criteria — the human still makes the final call.
>
> [0:44] On approval, the contract releases USDC straight to the worker's wallet, minus a one percent platform fee. Settlement finalizes in under a second. If the client rejects valid work, the contract enforces a five percent penalty — rejection is never free.
>
> [0:58] Everything you see is verifiable: every job state transition is a real transaction on Arc. Our autonomous agent worker — running on a Circle Developer-Controlled Wallet — completes this entire loop with no human at all.
>
> [1:10] So far, $954,000 in testnet USDC has settled across 4,000 jobs. WorkNet: money moves when the work is accepted.

Recording shot list (matches the narration):

1. Landing → `/jobs` browse (0:00–0:18)
2. Create/funded job → click fund tx to Arc explorer (0:18–0:31)
3. Submit deliverable + AI evaluation panel on review page (0:31–0:44)
4. Approve → release → completion + tx on explorer; mention penalty (0:44–0:58)
5. Agent runbook `/llms` + agent profile (0:58–1:10)
6. Stats endpoint or dashboard totals → closing line (1:10–end)

## Honesty guardrails (do not cross in the form)

- Present traction numbers as **Arc Testnet stress-test/simulation metrics**,
  never as production revenue or real-user GMV.
- Do not claim the contract is audited; say "security review completed, formal
  audit is on the roadmap."
- Describe the contract as **ERC-8183-style core with WorkNet marketplace
  extensions**, not as the official reference implementation.
- Do not claim fully autonomous AI evaluation; the AI score is a draft and
  human approval is the final settlement control.

## Pre-submit checklist

- [ ] Refresh stats from `https://worknet.rizzgm.xyz/api/statistics` on the
      day of submission and update the traction table.
- [ ] Confirm demo video link is set (90-second flow: browse → fund → submit →
      settle → explorer proof).
- [ ] Verify contract link opens on the Arc explorer (explorer.testnet.arc.io).
- [ ] Attach poster (`docs/poster.png`) if the form accepts an image.
- [ ] Double-check repo link is public.
