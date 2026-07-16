# Circle Grant Application Form - Arc WorkNet

This document contains the completed responses for the Circle Grant application, pre-filled using the codebase and technical specifications of Arc WorkNet.

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

**ArcWorkNet**

---

## Founder names, roles, bios

**Muhammad Rizky**
*Founder & Lead Full-Stack Engineer*
Software Engineer specializing in Next.js, Solidity, AI Agents, and Web3 infrastructure. Experienced in building production web applications, database integration, and decentralized protocols. Lead builder of Arc WorkNet, designing the customized escrow smart contracts and frontend workflow.

---

## Project website

**https://arcworknet.xyz** *(atau domain production Anda)*

---

## Project X Handle

**@ArcWorkNet** *(atau username X Anda)*

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

**Arc WorkNet**

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
The "Agentic Economy" is scaling rapidly. AI agents are now capable of executing specific development, design, and research tasks autonomously. However, they lack a native, programmable escrow and payment protocol. Arc WorkNet solves this by introducing a dual-workforce freelance marketplace, allowing humans and AI agents to receive instant, programmable escrow payments with sub-second finality.

---

## What is your solution?

Arc WorkNet is an AI-native, USDC-funded freelance marketplace. 

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

- **Circle App Kit (Bridge & Unified Balance)**: To allow clients to bring USDC from other EVM chains (Base, Ethereum, Arbitrum) directly into their Arc WorkNet escrow budget without needing external bridging websites.
- **CCTP (Cross-Chain Transfer Protocol)**: To support native, capital-efficient, zero-slippage cross-chain USDC transfers.
- **Circle Smart Contract Platform (Event Monitors)**: To push onchain escrow events to our Supabase webhooks for seamless real-time UI updates.

---

# 4. Milestones and Timelines

---

## Milestone 1 — Core Infrastructure & Circle Integration

**Timeline**

*Month 1*

**Description**

- Complete backend database syncing with Supabase and deploy custom `ArcWorknetEscrow.sol` on Arc Testnet.
- Set up Privy authentication for user wallet connection.
- Standardize USDC ERC-20 6-decimal inputs across client actions (create, budget, fund).
- Connect event monitors to track escrow transfers.

**Deliverables**

- Smart contract deployed on Arc Testnet.
- Fully functional local/staging environment where users can connect wallets, create job posts, and initiate mock USDC approvals.
- Public GitHub repository with clean Next.js and Solidity code.

---

## Milestone 2 — MVP Launch

**Timeline**

*Month 2*

**Description**

- Launch the public beta application of Arc WorkNet.
- Implement the offchain worker/agent application dashboard.
- Integrate deliverable uploads (notes, files, and URL hashes) tied directly to onchain submissions.
- Implement the trustless rejection penalty (5% worker fee / 95% client refund) and test state-transitions.

**Deliverables**

- Live, accessible MVP dApp where clients can post real jobs.
- Interactive job applications flow for human workers and AI agent owners.
- First 10 successful completed mock jobs paid in testnet USDC.

---

## Milestone 3 — Production & Security

**Timeline**

*Month 3*

**Description**

- Integrate Circle App Kit's Bridge & Unified Balance to enable cross-chain deposits.
- Conduct a security review and gas optimization check of `ArcWorknetEscrow.sol`.
- Build the AI Evaluation Engine that automatically drafts scores for worker submissions before human review.
- Optimize database RLS policies and rate-limiting middleware to protect write APIs.

**Deliverables**

- Fully integrated cross-chain USDC funding panel in the UI.
- Escrow contract security audit report.
- Automated AI rating system outputting reviews for deliverables.

---

## Milestone 4 — Ecosystem Growth

**Timeline**

*Month 4*

**Description**

- Release the Arc WorkNet Developer SDK/API to allow autonomous AI agents on other chains to query jobs, apply, and submit work onchain.
- Launch community and partnership campaigns targeting Web3 developer groups and AI agent builders.
- Deploy the production smart contracts to Arc Mainnet.

**Deliverables**

- Public developer documentation, API schemas, and SDK packages.
- Successful mainnet launch with 100+ active user registrations.
- Production transactions using mainnet USDC.

---

# 5. Project Traction and Roadmap

---

## Current traction

- **Working Codebase**: Fully modular Next.js application, integrated with Supabase database schema and RLS policies.
- **Contract Deployment**: Deployed custom `ArcWorknetEscrow` contract on Arc Testnet supporting multi-stage job states.
- **Simulated Agents**: Implemented the framework for registering AI agents via ERC-8004 reputation/identity mappings.
- **Active Testing**: Handled mock applications, deliverable uploads, and completed escrow settlements in staging environment.

---

## Dune Analytics

**N/A** *(Not yet live on mainnet)*

---

## Are you funded?

**No** *(Self-funded bootstrapping phase)*

---

## Technical Roadmap

- **Phase 1: Architecture & Escrow Deployment** (Current): Setting up the database schema, RLS, and custom solidity contracts.
- **Phase 2: Circle Integration** (Months 1-2): Incorporating Privy, custom USDC-decimals validation, and Circle event monitoring webhooks.
- **Phase 3: Cross-Chain Payment UX** (Month 3): Integrating Circle App Kit to allow seamless USDC bridging.
- **Phase 4: Agent Economy SDK** (Month 4): Exposing JSON metadata structures and API endpoints for autonomous AI execution.

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