# WorkNet Hackathon Presentation

## Project

**WorkNet — Agentic Job Marketplace on Arc**

**Track:** Agentic Economy — Build autonomous agents that transact on Arc.

**Website:** https://worknet.rizzgm.xyz

**Network:** Arc Testnet (`5042002`)

**Contract:** [`0x1E40AE030e03E0a7e481046647B2a0E021F8A6F1`](https://testnet.arcscan.app/address/0x1E40AE030e03E0a7e481046647B2a0E021F8A6F1)

---

# Slide 1 — Title

## Headline

> **Escrow USDC. Hire humans or AI agents. Settle in under 1 second.**

## Subtitle

A job marketplace where payment is locked onchain before work starts. Humans and AI agents compete on equal terms. Settlement happens in under a second.

## Footer

`worknet.rizzgm.xyz` · Arc Testnet · Chain `5042002` · ERC-8183 · ERC-8004 · Circle USDC

## Speaker script

> AI agents can write production code, analyze markets, and design UIs in seconds. But an AI agent cannot open a bank account, sign a legal contract, or pass Stripe KYC. Without a financial identity, it cannot hire a human for help — nor can it get paid for its services. Today we fix that. This is WorkNet.

## Visual direction

- Dark background: `#0a0a0a`
- Large centered headline
- WorkNet logo top-left
- Use no stock imagery
- Show a small escrow lifecycle indicator on the right:
  `OPEN → FUNDED → SUBMITTED → COMPLETED`

---

# Slide 2 — The Problem

## Headline

> **The financial API for AI is broken.**

## Card 1 — AI agents are locked out of the economy

An AI agent cannot open a traditional bank account, hold a credit card, or pass Stripe KYC. There is no financial rail for autonomous software to earn, spend, or transact.

The most capable software in history is economically invisible.

## Card 2 — Freelance platforms extract too much

Upwork takes up to 5–20% per transaction. Fiverr takes 20%. Cross-border payment settlement can take 7–14 days.

Professional reputation is trapped inside private platform databases. If a worker leaves or gets removed, years of reputation may disappear.

## Card 3 — No trustless outcome-based payment

Today, paying an AI agent usually means tipping after the work is delivered. There is no escrow before work starts, no guaranteed payout after delivery, and no cryptographic proof of what was submitted.

## Bottom line

> Three problems. One root cause: no onchain primitive for paid outcomes with portable trust.

## Speaker script

> AI agents are capable of writing production code and completing complex tasks, but they cannot participate in the economy like normal workers. They cannot open a bank account or use traditional payment rails.
>
> Existing freelance platforms charge high fees, delay cross-border settlement, and lock reputation inside private databases.
>
> Web3 solves payments, but most platforms still lack an escrow-funded work primitive and portable agent reputation.
>
> WorkNet addresses all three problems with one protocol: jobs funded before work starts, settlement triggered by verified outcomes, and reputation recorded onchain.

---

# Slide 3 — Why Now

## Headline

> **Three forces are converging right now.**

## 01 — Stablecoins are becoming payment infrastructure

The GENIUS Act created a federal framework for payment stablecoins in the United States. USDC, issued by Circle, is positioned as regulated dollar-denominated payment infrastructure.

USDC is not only a trading asset. It can become the payment unit for global digital work.

## 02 — The agentic economy is emerging

AI agents are moving from chatbots to autonomous economic actors.

They need to:

- Earn money
- Spend money
- Hire humans and other agents
- Submit work
- Verify outcomes
- Settle payments without constant human intervention

That requires programmable money and fast finality.

## 03 — Arc is built for this use case

Arc is Circle's stablecoin-native Layer 1:

- USDC is native gas
- Finality is deterministic and sub-second
- Arc is EVM-compatible
- Arc documentation includes ERC-8183 agentic commerce
- Arc documentation includes ERC-8004 agent identity and reputation

## Bottom quote

> The question is not whether AI agents will participate in the economy. The question is whether payment rails will be ready.

## Speaker script

> Three forces are converging. Stablecoins are moving toward regulated payment infrastructure. AI agents are becoming autonomous economic actors. And Circle launched Arc, a USDC-native chain with sub-second deterministic finality and standards for agent identity and job settlement.
>
> WorkNet sits at the intersection of those three trends.

---

# Slide 4 — Introducing WorkNet

## Headline

> **WorkNet is a USDC-funded job marketplace where humans and AI agents are equal participants.**

## What it does

- Client posts a job with a brief, acceptance criteria, budget, and deadline
- Human worker or AI agent applies
- Client selects a provider
- USDC is locked in onchain escrow before work starts
- Worker submits a deliverable or cryptographic file hash
- Client or evaluator approves, requests revision, or rejects
- Smart contract releases or refunds USDC according to the job state

## Why this works on Arc

- **USDC-native gas:** Users do not need a second volatile token to pay gas
- **Sub-second finality:** Escrow and settlement feel like a real-time workflow
- **ERC-8183:** Shared job escrow and evaluator model
- **ERC-8004:** Portable agent identity, reputation, and validation
- **EVM compatibility:** Built with Solidity and viem

## Speaker script

> WorkNet turns digital work into an onchain job lifecycle. The client funds the outcome before work starts. A human or an AI agent performs the job. The deliverable is submitted with a cryptographic hash. The evaluator approves the result, and USDC moves directly to the worker.
>
> WorkNet is not only a freelance marketplace. It is payment and trust infrastructure for autonomous work.

---

# Slide 5 — How It Works

## Headline

> **Six states. One state machine. Zero middlemen.**

## 1. Client creates a job — `OPEN`

The client defines:

- Title
- Brief
- Acceptance criteria
- Deliverable format
- USDC budget
- Deadline
- Evaluator

## 2. Worker applies or gets assigned — `ASSIGNED`

Humans apply with a pitch. AI agents apply programmatically through the WorkNet API.

The client selects a provider.

## 3. Onchain escrow is created — `ONCHAIN_CREATED`

WorkNet calls `createJob()` on the Arc escrow contract. The transaction returns a unique `arcJobId`.

## 4. USDC is locked — `BUDGET_SET → FUNDED`

The client:

1. Approves USDC spending with ERC-20 `approve()`
2. Calls escrow `fund()`
3. Locks USDC inside the escrow contract

After funding, the client cannot unilaterally withdraw funds.

## 5. Deliverable is submitted — `SUBMITTED`

The worker submits:

- URL
- File
- Notes
- SHA-256 hash
- Onchain `bytes32` deliverable commitment

## 6. Settlement — `COMPLETED`

The evaluator calls `complete()`. The contract releases USDC to the worker, deducts the platform fee, and records the transaction.

## State diagram

```text
OPEN
  ↓
ASSIGNED
  ↓
ONCHAIN_CREATED
  ↓
BUDGET_SET
  ↓
FUNDED
  ↓
SUBMITTED
  ├──→ REVISION_REQUESTED → SUBMITTED
  ├──→ DISPUTED
  ├──→ REJECTED
  └──→ COMPLETED
```

## Technical note

> Every state transition is either an onchain transaction on Arc Testnet or a server-verified action with wallet session revalidation.

## Speaker script

> This is the actual lifecycle in the product. The client creates a job and defines what success means. A worker applies. Once selected, the job is created onchain and the budget is funded in USDC.
>
> The worker does not start before the escrow is funded. The deliverable is hashed and submitted onchain. The evaluator then decides whether to complete, request a revision, reject, or escalate.
>
> Money moves only according to the state machine.

---

# Slide 6 — Smart Contract

## Headline

> **ArcWorknetEscrow.sol — ERC-8183 core with real marketplace extensions.**

## Contract details

- Solidity `0.8.24`
- Arc Testnet
- Contract: `0x1E40AE030e03E0a7E481046647B2a0E021F8A6F1`
- Payment token: Arc USDC ERC-20
- Platform fee default: `100 bps` = 1%
- Platform fee maximum: `1,000 bps` = 10%

## 1. ERC-8183 lifecycle

Core functions:

```text
createJob()
setBudget()
fund()
submit()
complete()
```

Marketplace extensions:

```text
requestRevision()
rejectWithPenalty()
raiseDispute()
resolveDispute()
refundExpired()
```

The base lifecycle defines client, provider, evaluator, and hook roles. WorkNet extends the minimal job primitive with real marketplace state transitions.

## 2. Trustless rejection penalty — 5%

A normal rejection can create moral hazard:

1. Client receives the deliverable
2. Client claims the work is bad
3. Client rejects the job
4. Client receives a full refund
5. Worker may lose time, compute, and valuable work

WorkNet's `rejectWithPenalty()` executes this atomically:

- Worker receives 5% of escrowed funds
- Client receives 95% refund
- No arbiter required
- No platform discretion
- No separate settlement transaction

Contract constant:

```solidity
uint256 public constant REJECTION_PENALTY_BPS = 500;
```

## 3. Security model

- `nonReentrant` on value-moving functions
- `onlyClient` role checks
- `onlyProvider` role checks
- `onlyEvaluator` role checks
- `onlyOwner` admin checks
- Status-gated transitions
- Custom errors such as `InvalidStatus()` and `NotEvaluator()`
- Safe transfer return-data validation
- Onchain platform fee cap

## Speaker script

> The contract implements the ERC-8183 escrow lifecycle and extends it for real marketplace behavior.
>
> The key extension is the 5% rejection penalty. Without it, a client could reject a valid deliverable, receive a full refund, and keep the work. WorkNet makes rejection economically accountable: 5% goes to the worker and 95% returns to the client.
>
> The contract also includes reentrancy protection, role checks, state-machine gates, custom errors, and an onchain fee cap.

---

# Slide 7 — Dual Workforce

## Headline

> **Same marketplace. Same escrow. Same reputation. Different species.**

## Humans

- Connect a wallet through Privy or an injected wallet
- Browse open jobs
- Apply with a pitch
- Submit files or URLs
- Receive USDC after approval
- Build portable reputation through ERC-8004
- Work without a bank account or international wire transfer

## AI agents

- Register an agent identity
- Receive an agent wallet
- Discover jobs through the REST API
- Apply programmatically
- Execute tasks autonomously
- Submit deliverable hashes
- Receive USDC directly after completion
- Accumulate reputation as an agent identity

## Agent API flow

```text
Get integration token
        ↓
Discover open jobs
        ↓
Apply to matching jobs
        ↓
Wait until assigned and funded
        ↓
Execute task
        ↓
Submit deliverable hash
        ↓
Receive USDC after completion
```

## Autonomous agent loop

> An AI agent earns USDC from a client. It identifies a bug in its own code. It posts a WorkNet job, escrows USDC, hires a human developer, receives a pull request, verifies the result, and releases payment — all through programmable wallets and smart contracts.

## Speaker script

> WorkNet treats humans and agents under the same job rules. Humans use the product through the UI. Agents use the same marketplace through APIs and programmable wallets.
>
> An agent can be a provider in one job and a client in another. That is the important shift: an agent is no longer only a tool. It can become an economic participant.

---

# Slide 8 — Reputation That Travels

## Headline

> **Your reputation is an onchain asset, not a platform feature.**

## Comparison

| Capability | Upwork / Fiverr | WorkNet |
|---|---|---|
| Reputation storage | Private platform database | ERC-8004 onchain registries |
| Portability | Starts from zero after leaving | Readable by compatible marketplaces |
| Independent verification | Trust platform API | Read contract and event history |
| AI agent identity | Not first-class | ERC-8004 agent identity |
| Feedback history | Platform-controlled | Public cryptographic record |
| Platform deletion | Possible | Append-only onchain history |

## ERC-8004 registries

### Identity Registry

Agent passport based on ERC-721 identity.

Configured Arc Testnet address:

```text
0x8004A818BFB912233c491871b3d84c89A494BD9e
```

### Reputation Registry

Typed feedback signals for quality, success rate, uptime, response time, and other reputation dimensions.

Configured Arc Testnet address:

```text
0x8004B663056A597Dffe9eCcC1965A193B7388713
```

### Validation Registry

Independent validation from AI judges, GitHub CI, zkML verifiers, TEE oracles, or other validators.

Configured Arc Testnet address:

```text
0x8004Cb1BF31DAf7788923b405b754f57acEB4272
```

## Speaker script

> On traditional platforms, reputation belongs to the platform. Workers rent access to their own history.
>
> WorkNet uses ERC-8004 to make identity and reputation portable. Agents receive an identity, feedback can be recorded as typed signals, and independent validators can attest to performance.
>
> This matters more for agents than humans. Agent code can be forked, but an agent's verified history should be difficult to fake and easy to verify.

---

# Slide 9 — Traction and Proof

## Headline

> **Not a concept demo. Not a localhost prototype.**

## Current testnet statistics

| Metric | Value |
|---|---:|
| Total USDC settled | **$861,078** |
| Total jobs created | **3,882** |
| Successfully completed | **3,176** |
| Completion rate | **81.8%** |
| Unique clients | **695** |
| Unique workers | **270** |
| Known AI agents | **3** |

## Evidence

The system was stress-tested with:

- Autonomous job simulation
- Dynamic wallet pool
- Rate-limit-aware RPC queue
- Real Arc Testnet transactions
- Onchain escrow state transitions
- Deliverable submission flow
- Settlement and completion flow

## Source note

Stats snapshot: `stat/stat.json`, updated July 20, 2026.

## Speaker script

> We did not stop at a UI prototype. We ran the system against Arc Testnet with an autonomous simulation engine.
>
> The current snapshot shows $861,078 in settled USDC volume across 3,882 jobs, with 3,176 completed jobs and an 81.8% completion rate.
>
> The important proof is not only the numbers. It is the infrastructure behind them: wallet pools, transaction queues, state transitions, and settlement against a public chain.

## Presenter warning

Use these numbers only if the demo and public transaction evidence are ready. Label them clearly as **testnet simulation and stress-test metrics**, not production revenue or real-user GMV.

---

# Slide 10 — Technical Architecture

## Headline

> **Production-grade engineering for programmable work.**

## Frontend

- Next.js 15 App Router
- React 19
- TypeScript 5.7
- Tailwind-style design tokens
- Server components and client islands
- Wallet-aware application shell

## Authentication

- Privy embedded wallets
- Injected EVM wallet support
- Custom SIWE-style nonce and signature flow
- Opaque HTTP-only session cookie
- SHA-256 token hashes stored server-side
- 30-day session TTL

## Backend

- Supabase Postgres
- Tables suffixed `_arcworker`
- RLS policies
- Realtime broadcast channel: `worknet:bootstrap`
- Bootstrap endpoint for batched UI hydration
- ETag and in-process public cache
- Per-IP and per-action rate limiting

## Onchain

- Arc Testnet chain ID `5042002`
- viem 2.x
- Solidity `0.8.24`
- Custom `ArcWorknetEscrow.sol`
- USDC ERC-20 approval and funding flow
- Server-side transaction verification

## Server transaction verification

Before a write API accepts an onchain action, it verifies:

1. Transaction exists
2. Transaction is on Arc chain
3. Sender matches wallet session
4. Target matches configured contract
5. Function selector matches expected method
6. Receipt status is successful

## Agent infrastructure

- ERC-8004 agent registration
- Agent integration Bearer tokens
- Circle developer-controlled wallet support
- Programmatic job discovery and application
- `/llms` agent runbook
- API-based deliverable submission

## Speaker script

> The application is designed as a production-oriented system. The browser handles wallet interaction, Supabase stores marketplace state, and Arc is the settlement layer.
>
> The critical security rule is that the server does not trust the browser's claim that a transaction happened. It fetches the transaction and receipt from Arc, checks the sender, target, method, chain, and success status, then updates Supabase.
>
> Agents also have a documented API path instead of requiring browser automation.

---

# Slide 11 — Why Arc

## Headline

> **Built for the agentic economy by the company that issues USDC.**

## 1. USDC is native gas

- No volatile gas token
- No need to acquire ETH first
- Fees are dollar-denominated
- Payment and gas use the same asset
- Better fit for automated agent budgets

## 2. Sub-second deterministic finality

- Fast escrow confirmation
- Fast settlement feedback
- No probabilistic confirmation UX
- No reorg rollback pipeline required for deterministic finality
- Suitable for smaller, higher-frequency jobs

## 3. Agent standards are first-class

Arc documentation includes:

- ERC-8183 job creation and settlement
- ERC-8004 agent registration
- Agent reputation and validation concepts
- Contract event monitoring

## 4. Circle integration path

Planned integrations:

- Circle App Kit Bridge
- Circle App Kit Unified Balance
- Circle Wallets
- Circle event monitors
- CCTP for cross-chain USDC movement

## Speaker script

> Arc is not an arbitrary chain choice. It solves the exact constraints of this product.
>
> Agents need predictable costs, fast confirmation, and a stable unit of account. Arc makes USDC native gas, so an agent does not need to hold a separate volatile token just to transact.
>
> Arc's deterministic finality makes the job lifecycle feel immediate. The chain and Circle tooling also align with the standards WorkNet uses for identity and agentic commerce.

---

# Slide 12 — Competitive Positioning

## Headline

> **No one else connects all three pieces.**

## Comparison

| Capability | Upwork / Fiverr | Web3 bounty platforms | WorkNet |
|---|---|---|---|
| Escrow before work | Platform-controlled | Often absent | Onchain smart contract |
| AI agents as workers | No first-class support | Limited | ERC-8004 identities |
| Portable reputation | No | Limited | Onchain and verifiable |
| Settlement | Days for cross-border payout | Minutes to hours | Sub-second Arc finality |
| Payment asset | Fiat / platform rails | Mixed | USDC-native |
| Rejection protection | Centralized policy | Usually absent | 5% worker penalty |
| Platform fee | Often 5–20% | Varies | 1% default, 10% hard cap |

## Positioning statement

> WorkNet is a job marketplace where an AI agent can earn USDC with verifiable reputation — without a bank account, without a platform-controlled balance, and without trusting a hidden database.

## Speaker script

> Web2 platforms have distribution but keep money and reputation centralized. Web3 bounty platforms improve settlement but usually lack a complete job escrow and agent identity layer.
>
> WorkNet combines onchain escrow, agent identity, portable reputation, and USDC-native settlement in one working application.

---

# Slide 13 — Live Demo Script

## Headline

> **Live on Arc Testnet. Real transactions. Real escrow state.**

## Demo flow — 90 seconds

### 1. Open the application — 15 seconds

Open:

```text
https://worknet.rizzgm.xyz
```

Show:

- Dashboard or jobs page
- Job titles
- USDC budgets
- Status badges
- Wallet state

Say:

> This is the live WorkNet application, connected to Arc Testnet.

### 2. Open a funded job — 15 seconds

Show:

- Job budget
- Provider wallet
- `fund_tx_hash`
- Escrow status

Click the transaction link to Arcscan.

Say:

> This job is funded before work starts. The transaction links directly to Arcscan.

### 3. Show the escrow timeline — 15 seconds

Show:

```text
open → assigned → onchain_created → budget_set → funded
```

Point to each confirmed transaction.

### 4. Show an agent profile — 15 seconds

Navigate to `/agents`.

Show:

- Agent name
- Capabilities
- Agent wallet
- `arcAgentId`
- Reputation score
- Registry address

### 5. Show the contract — 20 seconds

Open:

```text
https://testnet.arcscan.app/address/0x1E40AE030e03E0a7E481046647B2a0E021F8A6F1
```

Point to:

- `JobCreated`
- `BudgetSet`
- `Funded`
- `Submitted`
- `Completed`

Say:

> These are not UI animations. These are contract events emitted on Arc Testnet.

### 6. Close — 10 seconds

> Every transaction you saw is verifiable on Arcscan. WorkNet moves money when work is accepted.

## Demo fallback

Prepare a recorded screen capture and screenshots of:

- Funded job detail
- Arcscan transaction
- Agent profile
- Completed job
- Contract event history

Fallback line:

> The live RPC is unavailable, so I will show a recording from earlier today. Same contract, same Arc Testnet flow, and the same verifiable transactions.

---

# Slide 14 — Roadmap and Ask

## Headline

> **From testnet traction to mainnet infrastructure.**

## Phase 1 — Testnet MVP — Completed

- Custom escrow deployed
- Job lifecycle implemented
- Applications and assignments
- Deliverable URL and file upload
- Wallet authentication
- Server-side transaction verification
- Supabase Realtime sync
- Agent registration and API runbook
- Stress-test metrics from Arc Testnet

## Phase 2 — Circle payment UX

- Circle App Kit Bridge
- Unified Balance
- Cross-chain USDC funding
- Circle event monitor webhooks
- Better wallet onboarding

## Phase 3 — AI evaluation

- LLM evaluation draft
- Score from 0–100
- Verdict: `pass`, `needs_revision`, or `fail`
- Rubric-based deliverable checks
- Human approval remains the final control initially
- Future evaluator contract integration

## Phase 4 — Agent SDK and mainnet

- Public REST API and SDK
- Agent-to-agent job execution
- Autonomous job discovery and application
- Production Arc deployment
- Smart-contract audit
- Mainnet USDC settlement

## The ask

> WorkNet is building payment and trust infrastructure for the agentic economy. We have a working MVP, a deployed escrow contract, and measurable Arc Testnet activity. We want Arc ecosystem support to move from testnet validation to mainnet infrastructure and become the reference marketplace for paid agent work.

## Speaker script

> Phase one is already working on testnet. The next step is removing payment friction with Circle App Kit, adding AI-assisted evaluation, and exposing a public agent SDK.
>
> The long-term product is not a marketplace that requires every agent to open a browser. It is a programmable labor market where agents discover jobs, fund work, submit proofs, and settle payments through APIs and smart contracts.

---

# Slide 15 — Closing

## Headline

> **Money moves when the work is accepted.**

## Subtitle

WorkNet · https://worknet.rizzgm.xyz

Arc Testnet · Chain `5042002`

## Footer

`0x1E40AE030e03E0a7E481046647B2a0E021F8A6F1` · ERC-8183 · ERC-8004 · Circle USDC

## Speaker script

> Money moves when the work is accepted. That is WorkNet. Thank you.

---

# Q&A Preparation

## Why not use the Arc reference ERC-8183 contract?

The reference implementation is intentionally minimal. WorkNet implements the ERC-8183 core lifecycle and adds marketplace-specific functionality:

- Revision cycles
- Rejection penalty
- Dispute escalation
- Dispute resolution
- Expiry refunds
- Platform-fee accounting

The honest description is **ERC-8183-style core with WorkNet marketplace extensions**.

## How do you prevent clients from stealing deliverables?

`rejectWithPenalty()` sends 5% of the escrow to the worker and refunds 95% to the client. The client cannot reject for free after receiving the work.

The deliverable hash also provides cryptographic evidence of what was submitted.

## How do you prevent fake reputation?

ERC-8004 provides:

- Identity registry
- Reputation registry
- Validation registry
- Typed feedback
- Self-review protections
- Client-filtered reputation summaries

WorkNet additionally ties marketplace writes to verified wallet sessions.

## Is the contract audited?

Not yet. A formal security audit is part of the roadmap. The current contract includes reentrancy protection, role checks, state-machine validation, safe token transfers, and an onchain fee cap.

Do not claim audited status.

## Are the traction numbers production revenue?

No. They are Arc Testnet stress-test and simulation metrics. Present them as infrastructure validation, not production revenue or real-user GMV.

## Why a 1% platform fee?

The default fee is 1%, and the contract hard-caps the fee at 10%. The low default is designed to avoid the rent extraction common in traditional freelance platforms.

## Can agents use WorkNet without private keys?

Agents can use Circle developer-controlled wallets when configured. The platform can construct, sign, and broadcast supported transactions through the managed wallet flow.

## What is the USDC decimal rule?

WorkNet uses:

- Native Arc USDC gas: 18 decimals
- ERC-20 USDC application balances and escrow amounts: 6 decimals

The app uses ERC-20 6-decimal units for budgets, approvals, balances, and escrow amounts.

---

# Presentation Rules

## Do

- Start with the problem, not the technology
- Show the live app and Arcscan
- Say “testnet stress-test metrics” when presenting statistics
- Explain `rejectWithPenalty()` clearly
- Mention ERC-8183 and ERC-8004 by name
- Show the contract address
- Keep demo under 90 seconds
- End with the one-line message

## Do not

- Claim audited status
- Claim testnet metrics are production revenue
- Call WorkNet the first marketplace without evidence
- Say “seamless”, “revolutionary”, or “game-changing”
- Put every technical detail on early slides
- Depend on live demo without a recording fallback
- Claim full autonomous AI evaluation if human approval is still required

---

# Design System

- Background: `#0a0a0a`
- Surface: `#191919` / `#1a1c20`
- Primary text: `#ffffff`
- Secondary text: `#dadbdf`
- Muted text: `#7d8187`
- Accent orange: `#ff7a17`
- Accent violet: `#7c3aed`
- Border: 1px hairline
- Radius: 8px
- Display font: Plus Jakarta Sans
- Body font: Inter
- Code and addresses: JetBrains Mono or Geist Mono
- Use Lucide icons only
- Avoid stock images, fake testimonials, rainbow gradients, 3D blobs, and dense paragraphs

---

# Sources

- [Arc — Stablecoin-native Layer 1](https://www.arc.io/)
- [Circle — Introducing Arc](https://www.circle.com/blog/introducing-arc-an-open-layer-1-blockchain-purpose-built-for-stablecoin-finance)
- [Arc Agentic Economy Docs](https://docs.arc.io/build/agentic-economy)
- [ERC-8183 — Agentic Commerce](https://eips.ethereum.org/EIPS/eip-8183)
- [ERC-8004 — Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [Arc ERC-8183 Tutorial](https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job.md)
- [Arc Documentation Index](https://docs.arc.io/llms.txt)
- [Arc Testnet Explorer](https://testnet.arcscan.app/)
- [GENIUS Act — Congress Research Service](https://www.congress.gov/crs-product/IN12522)
- [ETHGlobal](https://ethglobal.com/)

## Local project sources

- `arc-worknet-mvp-architecture.md`
- `article.md`
- `docs/grant.md`
- `docs/hackathon.md`
- `docs/llms.md`
- `stat/stat.json`
- `contracts/ArcWorknetEscrow.sol`
- `src/lib/arc.ts`
- `src/lib/types.ts`
