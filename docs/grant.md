# Circle Grant Application Form - WorkNet

This document contains the completed responses for the Circle Grant application, pre-filled using the codebase and technical specifications of WorkNet.

---

# 1. Organization Information

## Primary contact first name

**Muhammad**

*(Nama depan legal penanggung jawab)*

---

## Primary contact last name

**Rizky**

*(Nama belakang legal penanggung jawab)*

---

## Email address

**[your-email@example.com]** 
*(Ganti dengan email aktif Anda)*

---

## Company Legal Entity Name

**Not Incorporated Yet**
*(Pilih 'Not Incorporated Yet' jika belum berbadan hukum)*

---

## Company Doing-Business-As (DBA) Name

**WorkNet**

---

## Founder names, roles, bios

**Muhammad Rizky**
*Founder & Lead Full-Stack Engineer*
Software Engineer specializing in Next.js, Solidity, AI Agents, and Web3 infrastructure. Experienced in building production web applications, database integration, and decentralized protocols. Lead builder of WorkNet, designing the customized escrow smart contracts and frontend workflow.

---

## Project website

**https://worknet.xyz** *(atau domain production Anda)*

---

## Project X Handle

**@WorkNet** *(atau username X Anda)*

---

## Where are you and your founders located?

**Muhammad Rizky, Founder, Depok, West Java, Indonesia**

---

## Where is your business located?

**Indonesia**

---

## Is your business incorporated?

**No**

---

# 2. Project Abstract

---

## Project Name

**WorkNet**

---

## One line description

**We build an AI-native freelance marketplace that enables human experts and autonomous AI agents to collaborate and receive payment using secure smart-contract escrows and Circle USDC on Arc Network.**

---

## What problem are you solving and why is it important?

Traditional freelance platforms (e.g., Upwork, Fiverr) fail to address the needs of the modern, decentralized digital economy:
1. **High Centralized Fees**: Platforms take 15-20% commission on worker earnings, discouraging talent.
2. **Slow, Expensive Cross-Border Settlement**: Withdrawing earnings takes 7 to 14 days and incurs high international wire/fx fees.
3. **No Support for Autonomous AI Workers**: AI agents cannot hold legacy bank accounts or credit cards, entirely locking them out of the freelance marketplace.
4. **Data Silos**: Portability of reputation (success rates, ratings, transaction history) does not exist; freelancers are locked into single platforms.

**Why it is important**:
The "Agentic Economy" is scaling rapidly. AI agents are now capable of executing specific development, design, and research tasks autonomously. However, they lack a native, programmable escrow and payment protocol. WorkNet solves this by introducing a dual-workforce freelance marketplace, allowing humans and AI agents to receive instant, programmable escrow payments with sub-second finality.

---

## What is your solution?

WorkNet is an AI-native, USDC-funded freelance marketplace. 

**Key Components**:
1. **Custom Escrow Contracts (`ArcWorknetEscrow.sol`)**: A fully transparent escrow contract handles the job lifecycle: `createJob -> setBudget -> approve USDC -> fund escrow -> submit deliverable -> complete/payout`.
2. **Trustless Rejection Protection**: To protect workers from exploitation (where clients reject work but steal the deliverable), our smart contract enforces a 5% rejection penalty. If a client rejects the work, 5% is paid to the worker to cover compute/resource costs, and 95% is refunded to the client.
3. **Dual Workforce Registry**: AI agents register using ERC-8004 identity registry standards, storing metadata schemas to prove their capabilities, while human freelancers login via Privy embedded Web3 wallets.
4. **AI-Assisted Evaluation**: Before a client manually approves work, an offchain AI judge evaluates the submitted deliverable (checking codebase/url quality against job criteria) and outputs an evaluation score to assist the client's decision.
5. **Circle App Kit Integration**: Unified Balance and Bridge integrations allow clients to easily bridge USDC from Base, Arbitrum, or Ethereum to fund job escrows on Arc Network in a single transaction.

---

## Why hasn't this problem been solved yet?

1. **High Gas and Slow Finality**: Performing complex escrow state changes and multi-party deposits on legacy chains (like Ethereum) was cost-prohibitive. Arc's sub-second block times and ultra-low fees make micro-escrows feasible.
2. **Lack of Identity Frameworks for AI Agents**: AI agents had no structured identity standards to build trust or manage a verifiable portfolio. The emergence of ERC-8004 identity/reputation schemas has unlocked portable reputation.
3. **Friction in Web3 UX**: Traditional crypto wallets (MetaMask) are too complex for non-crypto clients. The development of Circle App Kit (Unified Balance, Bridge) and embedded wallets now allows Web3 payment mechanics to be hidden behind web2-like interfaces.

---

## Why are you and your team uniquely suited?

We are active Web3 and AI developers with hands-on experience in full-stack engineering, EVM smart contracts, and next-generation developer tooling.
1. **Solidity & Next.js Experience**: We have already implemented the end-to-end dApp flow, from Next.js App Router UI, Supabase real-time indexers, to the deployed custom `ArcWorknetEscrow.sol` contract.
2. **Focus on UX**: We understand the exact friction points in decentralized payment flows, which is why we are integrating Circle App Kit and Privy to handle wallet friction.
3. **Niche Focus on Agentic Payments**: We are not just building a legacy freelance board; we are pioneering payments for autonomous AI agents, establishing an early wedge in the agentic commerce landscape.

---

# 3. Product Alignment Track

---

## Is your project currently live in production?

**No** *(Currently live on Arc Testnet)*

---

## Are you live on Arc?

**Yes** *(Our custom Escrow contract is successfully deployed on Arc Testnet at `0x1E40AE030e03E0a7E481046647B2a0E021F8A6F1`)*

---

## Which other chains are you currently live on?

**Sepolia Testnet** *(for cross-chain bridge testing)*

---

## Which Circle products are currently integrated?

- **USDC**: Circle's native stablecoin on Arc Testnet (`0x3600000000000000000000000000000000000000`) is integrated as the primary payment and escrow token in our smart contracts.
- **Programmable Wallets**: Integrated via Privy embedded wallets and Viem adapters to allow users to sign transactions.

---

## Which Circle products do you plan to integrate?

- **Circle App Kit (Bridge & Unified Balance)**: To allow clients to bring USDC from other EVM chains (Base, Ethereum, Arbitrum) directly into their WorkNet escrow budget without needing external bridging websites.
- **CCTP (Cross-Chain Transfer Protocol)**: To support native, capital-efficient, zero-slippage cross-chain USDC transfers.
- **Circle Smart Contract Platform (Event Monitors)**: To push onchain escrow events to our Supabase webhooks for seamless real-time UI updates.

---

# 4. Milestones and Timelines

---

## Status of previous milestones — delivered

The original Milestones 1–3 are complete and exceeded: the custom escrow is
deployed on Arc Testnet, the live dApp (worknet.rizzgm.xyz) supports wallet
onboarding, job posts, applications, direct invitations, messaging, USDC escrow
funding, hashed deliverable submission, AI draft evaluation, disputes, agent API
keys, and a headless autonomous agent worker on Circle Developer-Controlled
Wallets. Testnet traction stands at **$954,537 USDC settled across 4,037 created
/ 3,329 completed jobs (82.5% completion)** — far beyond the original "first 10
mock jobs" target. The updated milestones below cover the next phase: formal
audit, mainnet, the agent SDK, and onchain evaluation.

---

## Milestone 1 — Formal Audit & Hardening

**Timeline**

*Month 1*

**Description**

- Commission a third-party security audit of `ArcWorknetEscrow.sol` and remediate every critical and high finding before any mainnet deployment.
- Extend the committed internal review (`docs/arc_worknet_security_audit.md`) with property and state-machine tests for the escrow, plus an end-to-end Cypress suite covering the full job lifecycle in CI.
- Ship marketplace polish from the internal roadmap: onchain invoice/receipt generator for settled jobs, advanced job filtering and search, and a notification center with webhook alerts.

**Deliverables**

1. Published third-party escrow audit report with all critical and high findings remediated.
2. Contract state-machine test suite and end-to-end Cypress suite running in CI.
3. Invoice generator, advanced search, and notification center live in production.

---

## Milestone 2 — Arc Mainnet Launch

**Timeline**

*Month 2*

**Description**

- Deploy the audited escrow to Arc Mainnet with real USDC settlement and onchain platform-fee capture.
- Harden production operations: resumable indexer, Circle event monitor webhooks with HMAC verification, monitoring dashboards, and an incident runbook.
- Smooth mainnet onboarding through Privy plus Circle App Kit (Bridge, Unified Balance) building on the shipped Gateway configuration.

**Deliverables**

1. `ArcWorknetEscrow` live on Arc Mainnet processing production USDC transactions.
2. Mainnet launch with 100+ active registered users and the first jobs paid end-to-end in mainnet USDC.
3. Public status page linking every settlement to a verifiable onchain transaction.

---

## Milestone 3 — Agent SDK & Developer Ecosystem

**Timeline**

*Month 3*

**Description**

- Publish the developer platform: OpenAPI schemas, full API documentation, and a TypeScript SDK covering agent API-key auth, job discovery, application, deliverable submission, and settlement verification.
- Grow the `/llms` runbook into complete developer documentation with quickstarts for Circle Developer-Controlled Wallets and the autonomous worker runner.
- Onboard third-party agent builders through bounties and integrations beyond our own `run-agent-worker` reference implementation.

**Deliverables**

1. Public developer documentation, OpenAPI schemas, and the WorkNet Agent SDK published on npm.
2. At least 3 third-party autonomous agents operating on WorkNet through the SDK.
3. Public worker/agent leaderboard and reputation surface built on ERC-8004 signals.

---

## Milestone 4 — Onchain Evaluation & Agent-to-Agent Economy

**Timeline**

*Month 4*

**Description**

- Record AI evaluation verdicts and reputation signals onchain through the ERC-8004 validation and reputation registries, keeping human override as the final settlement control.
- Promote agents from workers to clients: posting jobs, funding escrow, and settling payouts programmatically — true agent-to-agent commerce.
- Introduce a Nanopayments-based micro-task job type for high-frequency, low-value agent work.

**Deliverables**

1. AI evaluation verdicts and reputation written to ERC-8004 registries on job completion.
2. A live agent-to-agent flow: an autonomous agent client funds a job that another agent completes and settles.
3. Micro-task job type with per-task USDC nanopayment settlement.

---

## One-line grant-milestone format (for forms)

Format: what will exist at completion | Circle product involved | target date | success metric

- Published third-party audit report for ArcWorknetEscrow, automated CI test suites, and marketplace polish (invoice generator, advanced search, notification center) | Arc Testnet (escrow contract), USDC | Oct 2026 | 0 unresolved critical/high audit findings; 100% of escrow state transitions covered by automated tests
- Audited escrow live on Arc Mainnet with production USDC settlement, onchain platform-fee capture, and a public status page linking every settlement to an onchain tx | Arc Mainnet, USDC (native gas + settlement), Circle event monitors, App Kit (Bridge / Unified Balance) | Nov 2026 | 100+ registered users; ≥50 jobs paid end-to-end in mainnet USDC
- Public developer platform: OpenAPI schemas, docs, and WorkNet Agent SDK on npm; third-party autonomous agents onboarded; public ERC-8004 reputation leaderboard | Arc, USDC, Circle Developer-Controlled Wallets | Dec 2026 | ≥3 third-party autonomous agents completing real jobs through the SDK
- Onchain AI-evaluation verdicts and reputation written to ERC-8004 registries, agents-as-clients job funding, and nanopayment micro-task jobs | Arc, USDC, Circle Nanopayments | Jan 2027 | ≥1 live agent-to-agent job funded and settled fully onchain; micro-task job type live with per-task USDC settlement

---

# 5. Project Traction and Roadmap

---

## Current traction

- **Working Codebase**: Fully modular Next.js application, integrated with Supabase database schema and RLS policies.
- **Contract Deployment**: Deployed custom `ArcWorknetEscrow` contract on Arc Testnet supporting multi-stage job states, revision, rejection penalty, refunds, and disputes.
- **Agent Economy**: Agent registration with ERC-8004 registry configuration, scoped agent API keys, a documented `/llms` runbook, and a headless autonomous agent worker on Circle Developer-Controlled Wallets.
- **AI Evaluation**: Rubric-based deliverable scoring API (0–100, pass/needs_revision/fail) integrated into the client review flow.
- **Testnet Traction**: $954,537 USDC settled across 4,037 created / 3,329 completed jobs (82.5% completion) with 696 clients and 271 workers — verified via the public statistics endpoint.

---

## Dune Analytics

**N/A** *(Not yet live on mainnet)*

---

## Are you funded?

**No** *(Self-funded bootstrapping phase)*

---

## Technical Roadmap

- **Phase 1: Architecture & Escrow Deployment** (Delivered): Custom `ArcWorknetEscrow` live on Arc Testnet, Supabase schema with RLS, and a public dApp where wallets create, fund, and settle jobs — $954K USDC settled across 4,037 jobs to date.
- **Phase 2: Circle Integration** (Delivered): Privy wallet auth with opaque HTTP-only sessions, strict USDC 6-decimal escrow math, Circle event webhooks with HMAC verification, scoped agent API keys, and a headless autonomous worker running on Circle Developer-Controlled Wallets.
- **Phase 3: Cross-Chain Payment UX & AI Evaluation** (Delivered): App Kit bridge panel with Circle Gateway unified-balance configuration across Arc, Base, and Arbitrum, hardened CCTP relay, and a rubric-based AI evaluator drafting a verdict for every deliverable before human release.
- **Phase 4: Trust Infrastructure** (Month 1): Third-party escrow audit with every critical finding remediated, full CI state-machine and end-to-end coverage, onchain invoice receipts, and a public notification center — turning the testnet MVP into auditable, institution-grade infrastructure.
- **Phase 5: Arc Mainnet Settlement** (Month 2): The audited escrow settling production USDC with onchain fee capture and App Kit onboarding, where every payout links to a verifiable Arc transaction — a labor market where money moves only when work is accepted, now at mainnet scale with 100+ users.
- **Phase 6: Agent Economy SDK** (Month 3): OpenAPI schemas and a TypeScript SDK on npm that let any autonomous agent, from any chain, discover jobs, apply, execute, submit hashed proofs, and collect USDC through a Circle wallet — no browser, no human, no platform lock-in.
- **Phase 7: Autonomous Agent-to-Agent Economy** (Month 4): AI verdicts and reputation written to ERC-8004 registries, agents promoted from workers to clients who post and fund their own jobs, and Circle Nanopayments micro-tasks — a self-operating labor market where software hires software.

### Compact version (1,189/1,250 chars — for form field limits)

```text
Phase 1: Architecture & Escrow Deployment (Delivered): Custom ArcWorknetEscrow live on Arc Testnet with RLS-backed schema — $954K USDC settled across 4,037 jobs.
Phase 2: Circle Integration (Delivered): Privy wallet auth, USDC 6-decimal escrow math, HMAC Circle webhooks, agent API keys, autonomous worker on Developer-Controlled Wallets.
Phase 3: Cross-Chain UX & AI Evaluation (Delivered): App Kit bridge with Gateway unified balance (Arc/Base/Arbitrum), CCTP relay, rubric-based AI deliverable evaluator.
Phase 4: Trust Infrastructure (Month 1): Third-party escrow audit fully remediated, CI state-machine + E2E tests, onchain invoices, notification center.
Phase 5: Arc Mainnet Settlement (Month 2): Audited escrow settling production USDC with onchain fee capture — money moves only when work is accepted; 100+ users.
Phase 6: Agent Economy SDK (Month 3): OpenAPI schemas + TypeScript SDK on npm: any agent discovers jobs, executes, submits hashed proofs, collects USDC — no browser, no human.
Phase 7: Agent-to-Agent Economy (Month 4): AI verdicts + reputation onchain via ERC-8004, agents as clients funding their own jobs, Circle Nanopayments micro-tasks — software hires software.
```

---

## How will this grant support your roadmap?

1. **Security & Smart Contract Audits ($5,000)**: To ensure our custom escrow contract (`ArcWorknetEscrow.sol`) has zero vulnerabilities regarding user fund lockups.
2. **Infrastructure and API Hosting ($3,000)**: Defray hosting costs for Next.js servers, Supabase Edge Functions, database scale-up, and dedicated RPC node access on Arc.
3. **Developer Ecosystem Incentives ($2,000)**: To distribute initial USDC micro-grants to the first AI agent builders who successfully deploy agents that perform jobs on our platform.

---

# 6. Deck and Demo

---

## Video demo of the product

**[https://www.youtube.com/watch?v=example-video-id]** 
*(Ganti dengan link video demo Anda - disarankan merekam layar aplikasi saat ini menunjukkan pembuatan job, funding, dan submission)*

---

## Investor Deck

**[https://docs.google.com/presentation/d/example-deck-id]** 
*(Ganti dengan link deck presentasi Anda)*

---

# 7. Conflict of Interest

**No Conflict of Interest**

---

# Tips Agar Grant Lebih Kuat (Reference Only)

Reviewer biasanya mencari:
- ✅ Masalah yang nyata: Freelance fees, cross-border speeds, and AI economy payments.
- ✅ Solusi yang jelas: Custom blockchain escrows + unified workforce.
- ✅ Technical feasibility: Solid tech stack (Next.js, Supabase, Solidity, Viem).
- ✅ Penggunaan Circle Products: USDC, Programmable Wallets, and App Kit.
- ✅ Milestone yang measurable: Specific monthly deliverables.