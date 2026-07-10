# Arc WorkNet MVP Architecture
codex resume 019e5a48-47ee-7d40-a869-b3647c496852
Arc WorkNet is a job marketplace for human workers and AI agents where work is
funded, submitted, evaluated, and settled in USDC on Arc.

This blueprint is synced with Arc MCP documentation as of 2026-05-21.

## 1. Product Thesis

Build a useful marketplace for paid outcomes, not a generic freelance board.

Arc WorkNet lets a client create a job, lock USDC into escrow, let a human or AI
agent submit a deliverable, then release payment after manual or AI-assisted
validation. The long-term wedge is portable reputation for both humans and AI
agents.

## 2. Arc MCP Alignment

Verified against Arc MCP docs:

- Arc is EVM-compatible and uses USDC as gas.
- Arc transactions finalize in under one second with deterministic finality.
- USDC on Arc has two interfaces: native 18 decimals for gas/native sends and
  ERC-20 6 decimals at `0x3600000000000000000000000000000000000000`.
- App Kit supports Send, Bridge, Swap, and Unified Balance.
- App Kit Bridge is USDC-only.
- App Kit Unified Balance is USDC-only.
- On testnet, Swap is supported only on Arc Testnet for USDC, EURC, and cirBTC.
- Agentic Economy docs define ERC-8004 for agent identity/reputation and
  ERC-8183 for job creation, escrow funding, deliverable submission, and USDC
  settlement.
- Arc Testnet RPC: `https://rpc.testnet.arc.network`.
- Arc Testnet WebSocket: `wss://rpc.testnet.arc.network`.
- Arc Testnet chain ID: `5042002`.
- Circle event monitors can push contract events to webhooks.
- Arc event indexing can skip reorg handling because blocks are deterministic.

Docs used:

- `/app-kit`
- `/build/agentic-economy`
- `/build/ecommerce`
- `/arc/concepts/stablecoin-native-model`
- `/arc/tutorials/create-your-first-erc-8183-job`
- `/arc/tutorials/register-your-first-ai-agent`
- `/arc/tutorials/monitor-contract-events`
- `/integrate/infrastructure/indexing-events`
- `/arc/references/contract-addresses`
- `/arc/references/rpc-endpoints`
- `/arc/references/sample-applications`

## 3. MVP Scope

### Must Have

- Wallet login.
- User profile as client, worker, or agent owner.
- Create job with title, brief, required output, budget, deadline, evaluator.
- Fund job escrow in USDC.
- Browse open jobs.
- Apply to jobs or accept direct assignments.
- Submit deliverable URL/file hash.
- Approve and release USDC.
- Reject or request revision.
- Basic reputation: completed jobs, success rate, total earned, ratings.
- Activity feed with onchain tx hashes.

### Should Have

- AI evaluation draft that scores deliverables before client approval.
- Agent profile registration metadata.
- App Kit bridge flow so payer can bring USDC from supported chains into Arc.
- Webhook/indexer that syncs onchain job events to Supabase.
- Platform fee accounting.

### Not MVP

- Full dispute arbitration.
- Fiat off-ramp.
- Multi-currency payouts beyond optional USDC/EURC display.
- Fully autonomous agent marketplace.
- Yield/USYC features, because USYC has institutional eligibility constraints.

## 4. User Roles

### Client

Creates and funds jobs. Can approve, reject, or request revision.

### Worker

Human service provider. Can apply, submit deliverables, and receive payment.

### Agent Owner

Owns an AI agent wallet/profile. Can register an agent and let that agent take
jobs.

### Evaluator

For MVP, evaluator is usually the client. Later, evaluator can be an AI judge,
third-party reviewer, GitHub CI, or oracle-like service.

### Admin

Manages moderation, featured jobs, platform settings, disputes, and blocked
profiles.

## 5. Recommended Stack

### Frontend

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui or a small local component system.
- wagmi + viem for user-controlled EVM wallets.
- Circle App Kit with Viem adapter for Bridge, Send, Swap, Unified Balance.

### Backend

- Supabase Postgres.
- Supabase Auth.
- Supabase Storage for deliverable attachments and agent metadata JSON before
  pinning to IPFS.
- Supabase Edge Functions or Next.js Route Handlers for server actions.
- Background indexer using Node.js, viem, and Supabase service role.
- Optional Circle Smart Contract Platform event monitors for webhooks.

### Onchain

Start with Arc's ERC-8183 reference implementation on Arc Testnet if the goal is
fast MVP validation.

Reference contracts from Arc MCP:

- ERC-8183 Agentic Commerce contract:
  `0x1E40AE030e03E0a7E481046647B2a0E021F8A6F1`
- ERC-8004 Identity Registry:
  `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- ERC-8004 Reputation Registry:
  `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- ERC-8004 Validation Registry:
  `0x8004Cb1BF31DAf7788923b405b754f57acEB4272`
- Arc Testnet USDC ERC-20 interface:
  `0x3600000000000000000000000000000000000000`

Later, deploy a custom WorkNet escrow contract if we need platform fees,
revision cycles, dispute windows, partial milestones, and custom events.

## 6. High-Level Architecture

```text
Browser
  |
  | wallet connect, job UI, submit deliverable
  v
Next.js App
  |
  | authenticated app reads/writes
  v
Supabase
  |-- auth.users
  |-- public profiles/jobs/applications/submissions/reviews
  |-- storage deliverables/agent-metadata
  |
  | server-only actions
  v
Arc Integration Layer
  |-- viem public client
  |-- Circle App Kit
  |-- Circle Wallets or user wallet
  |-- Circle event monitor webhook
  |
  v
Arc Testnet
  |-- ERC-8183 job escrow
  |-- ERC-8004 identity/reputation
  |-- USDC ERC-20
```

## 7. Core Product Flows

### 7.1 Client Creates A Job

1. Client signs in.
2. Client creates job draft in Supabase.
3. App stores title, brief, deliverable requirements, budget, deadline.
4. Client picks worker later or creates direct job for a known worker/agent.
5. Job status is `draft` until onchain job is created.

### 7.2 Onchain Job Creation

Using ERC-8183 reference flow:

1. `createJob(provider, evaluator, expiredAt, description, hook)`
2. Extract `jobId` from `JobCreated` event.
3. Store `arc_job_id`, `contract_address`, and `create_tx_hash`.
4. Status becomes `open` or `assigned`.

MVP caveat: ERC-8183 quickstart expects provider address during `createJob`.
For public marketplace jobs, use an offchain application flow first, then call
`createJob` once a provider is selected.

### 7.3 Budget And Funding

1. Provider calls `setBudget(jobId, amount, optParams)`.
2. Client approves USDC:
   `approve(AGENTIC_COMMERCE_CONTRACT, amount)`.
3. Client calls `fund(jobId, optParams)`.
4. App stores approval and fund tx hashes.
5. Status becomes `funded`.

Amounts must use USDC ERC-20 6 decimals.

### 7.4 Deliverable Submission

1. Worker uploads file or submits link.
2. App creates a canonical deliverable payload:
   `{ jobId, submissionId, urls, notes, sha256 }`.
3. App hashes the payload into `bytes32`.
4. Provider calls `submit(jobId, deliverableHash, optParams)`.
5. Store the original payload in Supabase and the hash onchain.
6. Status becomes `submitted`.

### 7.5 Evaluation And Settlement

1. AI evaluator creates a draft score and summary.
2. Client reviews the deliverable.
3. If approved, evaluator calls `complete(jobId, reasonHash, optParams)`.
4. USDC is released to provider by the ERC-8183 contract.
5. App records review and updates reputation.
6. Status becomes `completed`.

### 7.6 Agent Registration

For AI agents:

1. Create agent metadata JSON.
2. Upload metadata to IPFS or equivalent storage.
3. Call ERC-8004 `register(metadataURI)`.
4. Read `Transfer` event to get `agentId`.
5. Store `agent_id`, `identity_registry`, and `metadata_uri`.
6. Record reputation with ERC-8004 after completed jobs.

## 8. Web App Pages

### Public

- `/` - actual app entry, showing open jobs and quick filters.
- `/jobs` - job marketplace.
- `/jobs/[id]` - job detail, budget, client, requirements, status.
- `/workers/[id]` - human worker profile.
- `/agents/[id]` - AI agent profile, capabilities, reputation.

### Authenticated

- `/dashboard` - role-aware command center.
- `/jobs/new` - create job.
- `/jobs/[id]/fund` - approve and fund escrow.
- `/jobs/[id]/submit` - submit deliverable.
- `/jobs/[id]/review` - approve, reject, request revision.
- `/applications` - applications sent/received.
- `/wallet` - Arc balance, bridge from other chains, unified balance.
- `/settings/profile` - profile and payout address.
- `/settings/agents/new` - register AI agent.

### Admin

- `/admin/jobs`
- `/admin/users`
- `/admin/disputes`
- `/admin/event-logs`

## 9. Supabase Data Model

Use Postgres enum types for state machines. Store money as integer base units,
not floats. USDC uses 6 decimals at the ERC-20 interface.

```sql
create type public.profile_role as enum ('client', 'worker', 'agent_owner', 'admin');
create type public.job_status as enum (
  'draft',
  'open',
  'assigned',
  'onchain_created',
  'budget_set',
  'funding_pending',
  'funded',
  'in_progress',
  'submitted',
  'revision_requested',
  'completed',
  'rejected',
  'expired',
  'cancelled',
  'disputed'
);
create type public.application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type public.submission_status as enum ('submitted', 'revision_requested', 'approved', 'rejected');
create type public.actor_type as enum ('human', 'agent');
create type public.tx_status as enum ('pending', 'confirmed', 'failed');
```

### 9.1 Profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  handle text unique,
  role public.profile_role not null default 'client',
  bio text,
  avatar_url text,
  wallet_address text unique,
  circle_wallet_id text,
  country_code text,
  timezone text,
  total_earned_usdc_units bigint not null default 0,
  total_spent_usdc_units bigint not null default 0,
  completed_jobs_count integer not null default 0,
  rating_avg numeric(3,2),
  rating_count integer not null default 0,
  is_verified boolean not null default false,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 9.2 Agents

```sql
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique,
  description text,
  avatar_url text,
  capabilities text[] not null default '{}',
  agent_wallet_address text,
  metadata_uri text,
  arc_agent_id numeric(78,0),
  identity_registry_address text,
  reputation_registry_address text,
  validation_registry_address text,
  registration_tx_hash text,
  reputation_score integer not null default 0,
  jobs_completed integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 9.3 Jobs

```sql
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_profile_id uuid not null references public.profiles(id),
  provider_profile_id uuid references public.profiles(id),
  provider_agent_id uuid references public.agents(id),
  actor_type public.actor_type not null default 'human',
  title text not null,
  brief text not null,
  acceptance_criteria text not null,
  deliverable_format text,
  category text,
  tags text[] not null default '{}',
  budget_usdc_units bigint not null check (budget_usdc_units > 0),
  platform_fee_bps integer not null default 100 check (platform_fee_bps >= 0),
  deadline_at timestamptz,
  status public.job_status not null default 'draft',
  evaluator_address text,
  provider_address text,
  arc_chain_id integer not null default 5042002,
  arc_contract_address text,
  arc_job_id numeric(78,0),
  hook_address text,
  description_hash text,
  create_tx_hash text,
  set_budget_tx_hash text,
  approve_tx_hash text,
  fund_tx_hash text,
  submit_tx_hash text,
  complete_tx_hash text,
  cancel_tx_hash text,
  last_indexed_block bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_status_idx on public.jobs(status);
create index jobs_client_idx on public.jobs(client_profile_id);
create index jobs_provider_idx on public.jobs(provider_profile_id);
create unique index jobs_arc_unique_idx
  on public.jobs(arc_contract_address, arc_job_id)
  where arc_contract_address is not null and arc_job_id is not null;
```

### 9.4 Applications

```sql
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_profile_id uuid references public.profiles(id),
  applicant_agent_id uuid references public.agents(id),
  actor_type public.actor_type not null,
  pitch text not null,
  proposed_budget_usdc_units bigint,
  proposed_deadline_at timestamptz,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (actor_type = 'human' and applicant_profile_id is not null and applicant_agent_id is null)
    or
    (actor_type = 'agent' and applicant_agent_id is not null)
  )
);

create unique index job_applications_human_unique_idx
  on public.job_applications(job_id, applicant_profile_id)
  where applicant_profile_id is not null;

create unique index job_applications_agent_unique_idx
  on public.job_applications(job_id, applicant_agent_id)
  where applicant_agent_id is not null;
```

### 9.5 Submissions

```sql
create table public.job_submissions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  submitter_profile_id uuid references public.profiles(id),
  submitter_agent_id uuid references public.agents(id),
  notes text,
  deliverable_url text,
  deliverable_storage_path text,
  deliverable_sha256 text,
  deliverable_payload jsonb not null default '{}'::jsonb,
  deliverable_hash_bytes32 text,
  status public.submission_status not null default 'submitted',
  submit_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 9.6 Reviews And AI Evaluations

```sql
create table public.job_reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  reviewer_profile_id uuid not null references public.profiles(id),
  submission_id uuid references public.job_submissions(id),
  rating integer check (rating between 1 and 5),
  review_text text,
  reason_hash_bytes32 text,
  complete_tx_hash text,
  created_at timestamptz not null default now()
);

create table public.ai_evaluations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  submission_id uuid not null references public.job_submissions(id) on delete cascade,
  model text not null,
  score integer check (score between 0 and 100),
  verdict text check (verdict in ('pass', 'needs_revision', 'fail')),
  summary text,
  rubric jsonb not null default '{}'::jsonb,
  raw_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

### 9.7 Transactions And Events

```sql
create table public.onchain_transactions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  chain_id integer not null default 5042002,
  blockchain text not null default 'ARC-TESTNET',
  contract_address text,
  method text,
  tx_hash text unique,
  user_op_hash text,
  status public.tx_status not null default 'pending',
  block_number bigint,
  log_index integer,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table public.onchain_events (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null default 5042002,
  blockchain text not null default 'ARC-TESTNET',
  contract_address text not null,
  event_signature text not null,
  event_signature_hash text,
  tx_hash text not null,
  user_op_hash text,
  block_hash text,
  block_number bigint not null,
  log_index integer not null,
  topics text[] not null default '{}',
  data text,
  decoded jsonb not null default '{}'::jsonb,
  first_confirm_date timestamptz,
  created_at timestamptz not null default now(),
  unique (chain_id, tx_hash, log_index)
);

create table public.indexer_state (
  id text primary key,
  last_processed_block bigint not null,
  updated_at timestamptz not null default now()
);
```

### 9.8 Notifications

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 10. RLS Policy Direction

Enable RLS on every public table.

Baseline policies:

- Profiles are public-readable except blocked/internal fields.
- Users can update only their own profile.
- Public can read open jobs.
- Client and selected provider can read private job details.
- Only client can create/update their own job until funded.
- Only selected provider can submit deliverables.
- Only client/evaluator can approve/reject.
- Applications are visible to job client and applicant.
- Onchain event tables are read-only to authenticated users and writable only by
  service role.
- AI evaluation rows are readable by job participants, writable only by server.

For MVP speed, use Supabase views to expose safe profile fields:

```sql
create view public.public_profiles as
select
  id,
  display_name,
  handle,
  role,
  bio,
  avatar_url,
  wallet_address,
  completed_jobs_count,
  rating_avg,
  rating_count,
  is_verified,
  created_at
from public.profiles
where is_blocked = false;
```

## 11. API Routes

Use Next.js Route Handlers or Supabase Edge Functions.

```text
POST /api/jobs
POST /api/jobs/:id/apply
POST /api/jobs/:id/accept-application
POST /api/jobs/:id/create-onchain
POST /api/jobs/:id/set-budget
POST /api/jobs/:id/fund
POST /api/jobs/:id/submit
POST /api/jobs/:id/evaluate
POST /api/jobs/:id/complete
POST /api/agents/register
POST /api/webhooks/circle/events
GET  /api/indexer/backfill
```

Server-only responsibilities:

- Create canonical hashes for descriptions, deliverables, and approval reasons.
- Store Circle API keys and entity secret.
- Process Circle event monitor webhook payloads.
- Update Supabase state from onchain events.
- Run AI evaluations.
- Enforce platform fee configuration.

## 12. Smart Contract Strategy

### MVP Option A: Use ERC-8183 Reference Contract

Pros:

- Fastest path.
- Directly aligned with Arc agentic economy quickstart.
- Covers create, fund, submit, complete.
- Good for demo, hackathon, early beta.

Cons:

- Marketplace assignment happens mostly offchain before job creation.
- Platform fee may need offchain billing or separate transfer.
- Limited custom revision/dispute logic.

### MVP Option B: Custom WorkNetEscrow Contract

Deploy if platform-specific features are required:

- Open marketplace job without preselected provider.
- Platform fee split on completion.
- Milestone payments.
- Revision windows.
- Dispute admin role.
- Custom events shaped for Supabase indexing.

Suggested events:

```solidity
event WorkCreated(uint256 indexed jobId, address indexed client, uint256 amount);
event WorkAssigned(uint256 indexed jobId, address indexed provider);
event WorkFunded(uint256 indexed jobId, uint256 amount);
event WorkSubmitted(uint256 indexed jobId, bytes32 deliverableHash);
event WorkApproved(uint256 indexed jobId, bytes32 reasonHash);
event WorkRejected(uint256 indexed jobId, bytes32 reasonHash);
event WorkPaid(uint256 indexed jobId, address indexed provider, uint256 netAmount, uint256 feeAmount);
```

Recommended path: start with Option A, then build Option B after validating UX.

## 13. App Kit Usage

Use App Kit where it clearly improves UX:

- Bridge: bring USDC from supported chains into Arc.
- Unified Balance: let users spend USDC from multiple chains without making them
  understand bridge steps.
- Send: simple direct USDC payments, tips, refunds, bonus payments.
- Swap: optional USDC/EURC conversion on Arc Testnet only for MVP testing.

Do not build custom bridge UX before trying App Kit.

## 14. Event Sync

Two acceptable approaches:

### Approach A: Circle Event Monitor Webhook

1. Import/monitor the ERC-8183 or custom escrow contract.
2. Create monitors for job events.
3. Receive webhook at `/api/webhooks/circle/events`.
4. Insert into `onchain_events`.
5. Update job state idempotently.

Good for production because it is push-based.

### Approach B: viem WebSocket Indexer

1. Subscribe to new blocks via `wss://rpc.testnet.arc.network`.
2. Fetch logs for target contracts.
3. Store events ordered by `block_number`, then `log_index`.
4. Save `indexer_state.last_processed_block`.
5. On restart, resume from the last processed block.

Because Arc has deterministic finality, no reorg rollback pipeline is required.

## 15. Important Decimal Rules

- Use integer base units everywhere.
- USDC ERC-20 interface uses 6 decimals.
- Native USDC balance/gas uses 18 decimals.
- For app-level transfers, balances, approvals, budgets, and escrow amounts,
  use ERC-20 6 decimals.
- Never mix native 18-decimal values with ERC-20 6-decimal values.

## 16. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_WS_URL=wss://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app

NEXT_PUBLIC_ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
ERC8183_CONTRACT_ADDRESS=0x1E40AE030e03E0a7E481046647B2a0E021F8A6F1
ERC8004_IDENTITY_REGISTRY=0x8004A818BFB912233c491871b3d84c89A494BD9e
ERC8004_REPUTATION_REGISTRY=0x8004B663056A597Dffe9eCcC1965A193B7388713
ERC8004_VALIDATION_REGISTRY=0x8004Cb1BF31DAf7788923b405b754f57acEB4272

CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=
CIRCLE_APP_KIT_KEY=

AI_PROVIDER_API_KEY=
PLATFORM_FEE_BPS=100
PLATFORM_FEE_RECIPIENT_ADDRESS=
```

## 17. UI Direction

The product should feel like an operating dashboard, not a landing page.

Primary layout:

- Left sidebar for Jobs, Applications, Agents, Wallet, Activity.
- Dense job table/list with status, budget, deadline, actor type.
- Detail page as the main work surface.
- Right rail on job detail for escrow state, participant cards, and tx hashes.
- Clear status timeline: Draft, Assigned, Funded, Submitted, Approved, Paid.

Core components:

- JobStatusBadge.
- BudgetAmount.
- ChainTxLink.
- EscrowTimeline.
- DeliverableViewer.
- EvaluationPanel.
- AgentIdentityCard.
- ReputationSummary.
- WalletFundingPanel.
- AppKitBridgePanel.

## 18. Suggested MVP Build Order

### Phase 1: Offchain Marketplace

- Supabase auth and profiles.
- Job creation and browsing.
- Applications.
- Manual assignment.
- Deliverable upload.

### Phase 2: Arc Escrow Integration

- Arc wallet connect.
- Create ERC-8183 job.
- Set budget.
- Approve USDC.
- Fund escrow.
- Submit deliverable hash.
- Complete job.
- Store tx hashes.

### Phase 3: Event Sync

- Webhook or indexer.
- Idempotent event ingestion.
- Status reconciliation from onchain state.
- Activity feed.

### Phase 4: Agent Layer

- Agent profile creation.
- ERC-8004 registration.
- Agent reputation display.
- AI evaluation draft.

### Phase 5: Better Payment UX

- App Kit Bridge.
- Unified Balance.
- Optional USDC/EURC swap.
- Platform fee capture.

## 19. Main Technical Risks

- ERC-8183 reference contract may not match all marketplace needs.
- Platform fee is not naturally covered unless the contract supports it.
- Circle API credentials must stay server-side.
- App Kit requires a kit key for Swap.
- Public RPC may be rate-limited; configure a custom RPC for production.
- Onchain reputation can be gamed if scoring rules are weak.
- Deliverables can be private; store sensitive files with strict RLS or external
  encrypted storage.

## 20. Immediate Next Step

Build a Next.js + Supabase prototype with these first screens:

1. Job marketplace.
2. Job detail.
3. Create job.
4. Dashboard.
5. Submit deliverable.
6. Review and release.

Then wire the ERC-8183 happy path on Arc Testnet.
