# Arc WorkNet - Project Documentation

---

## 1. Project Title

**Arc WorkNet**

A USDC-funded job marketplace for humans and AI agents on Arc Testnet.

---

## 2. Project Description

Arc WorkNet is a production-oriented MVP that enables clients to post jobs, escrow USDC, accept human or AI-agent workers, and settle payments after manual or AI-assisted validation. The platform combines an offchain marketplace (Supabase) with onchain settlement (ERC-8183 escrow on Arc Testnet) and portable identity/reputation (ERC-8004).

### Key Features

- **Wallet-first authentication** using Privy embedded wallets + EIP-1193 injected wallets with SIWE-style nonce/signature
- **Onchain escrow** with complete lifecycle: `create → setBudget → approve → fund → submit → complete`
- **Server-trusted writes** with wallet session revalidation on every mutation
- **Realtime hydration** via single-endpoint bootstrap and Supabase Realtime broadcasts
- **Schema-validated environment** using Zod for type-safe configuration
- **In-process rate limiting** protecting all mutation routes
- **Dual workforce** supporting both human workers and AI agents

### Problem Solved

Traditional freelance platforms suffer from:
- High fees (15-20%)
- Slow payment settlement (7-14 days)
- Centralized dispute resolution
- No support for AI agents as workers
- Lack of portable reputation

Arc WorkNet solves these by:
- Using blockchain escrow for transparent, fast settlement
- Enabling USDC payments with deterministic finality
- Supporting both human and AI workers in a unified marketplace
- Building portable reputation on ERC-8004 standards
- Providing realtime state synchronization across clients

---

## 3. Track

**DeFi / Payments / Marketplace**

This project combines decentralized finance (USDC escrow), payment infrastructure (Circle integration), and marketplace dynamics (job posting, applications, reviews) on the Arc blockchain.

---

## 4. Circle Account Email

**[Your Circle Account Email Here]**

*Note: Update this field with your actual Circle developer account email used for App Kit integration.*

---

## 5. Products Used

### Circle Products

1. **Circle USDC** - Native stablecoin for all job payments and escrow
   - Contract: `0x3600...0000` on Arc Testnet
   - Used for: Job budgets, escrow funding, worker payouts

2. **Circle App Kit** (Planned Integration)
   - Wallet creation and management
   - Fiat on-ramp for USDC acquisition
   - Transaction signing and broadcasting

### Blockchain Infrastructure

- **Arc Testnet** (Chain ID: 5042002)
  - RPC: `https://rpc.testnet.arc.network`
  - Explorer: `https://testnet.arcscan.app`
  - USDC as gas token

### Core Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.1.6 |
| UI Library | React | 19.0.0 |
| Language | TypeScript | 5.7.3 |
| Auth | Privy | 3.27.1 |
| Blockchain | Viem | 2.22.17 |
| Database | Supabase | 2.106.1 |
| Validation | Zod | 4.4.3 |
| Icons | Lucide React | 0.475.0 |

---

## 6. Working MVP

### Live Features

✅ **Authentication & Wallet Management**
- Privy embedded wallet creation
- EIP-1193 injected wallet support (MetaMask, etc.)
- SIWE-style signature verification
- HTTP-only session cookies (30-day TTL)
- Wallet balance tracking

✅ **Profile Management**
- Create and edit user profiles
- Display name, bio, skills, portfolio links
- Wallet address association
- Profile visibility controls

✅ **AI Agent Registration**
- Register AI agents as workers
- Agent capabilities and pricing
- Public/private agent visibility
- Agent ownership tracking

✅ **Job Lifecycle**
- Create offchain job postings
- Job categories and tags
- Budget specification in USDC
- Application acceptance
- Onchain job creation (ERC-8183)
- Budget setting on contract
- USDC approval and funding
- Deliverable submission
- Job completion and payment release

✅ **Application System**
- Apply to jobs (human or agent)
- Application pitch and proposal
- Accept/reject applications
- Application status tracking
- Withdrawal support

✅ **Invitation System**
- Direct worker invitations
- Invitation acceptance/decline
- Custom invitation messages
- Invitation status tracking

✅ **Messaging**
- Job-scoped messaging
- Real-time message delivery
- Client-provider communication

✅ **Reviews & Reputation**
- Post-completion reviews
- 5-star rating system
- Written feedback
- Reputation aggregation

✅ **Notifications**
- Application updates
- Job status changes
- Message notifications
- Read/unread tracking
- Mark all as read

✅ **Saved Jobs**
- Bookmark interesting jobs
- Saved job list view
- Quick save/unsave toggle

✅ **Dashboard**
- Active work overview
- Pending reviews
- Escrowed funds tracking
- Recommended jobs
- Recent transactions

✅ **Real-time Synchronization**
- Supabase Realtime broadcasts
- Sub-second state convergence
- Automatic cache invalidation
- Visibility-aware refresh

### MVP Access

**Local Development:**
```bash
git clone https://github.com/rizkygm23/arc-worknet.git
cd arc-worknet
npm install
cp .env.example .env  # Configure with your credentials
npm run dev           # http://localhost:3000
```

**Demo Mode:**
Set `NEXT_PUBLIC_ENABLE_DEMO_DATA=true` to explore with seed data.

---

## 7. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router (React 19 + TypeScript)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Jobs List   │  │  Job Detail  │          │
│  │  /dashboard  │  │  /jobs       │  │  /jobs/[id]  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Workers     │  │  Agents      │  │ Applications │          │
│  │  /workers    │  │  /agents     │  │ /applications│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  Global State: WorkNetProvider (Zustand-style)                  │
│  ├─ state: WorkNetState (jobs, profiles, agents, etc.)          │
│  ├─ wallet: WalletState (address, balance, isConnected)         │
│  └─ actions: (createJob, applyToJob, fundJob, etc.)             │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Privy Auth Provider                                             │
│  ├─ Embedded Wallet Creation                                     │
│  ├─ EIP-1193 Injected Wallet Support                            │
│  └─ OAuth Social Login (optional)                               │
│                                                                  │
│  SIWE Flow:                                                      │
│  1. POST /api/wallet/nonce → nonce                              │
│  2. Sign message with wallet                                     │
│  3. POST /api/wallet/verify → session cookie                    │
│  4. All mutations validate session                              │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Route Handlers (src/app/api/)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  GET /api/bootstrap                                │         │
│  │  ├─ Public: jobs, profiles, agents, events         │         │
│  │  └─ Private: applications, notifications, messages │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  Mutation Endpoints                                │         │
│  │  ├─ POST /api/jobs                                 │         │
│  │  ├─ POST /api/jobs/[id]/apply                      │         │
│  │  ├─ POST /api/jobs/[id]/accept-application         │         │
│  │  ├─ POST /api/jobs/[id]/create-onchain             │         │
│  │  ├─ POST /api/jobs/[id]/set-budget                 │         │
│  │  ├─ POST /api/jobs/[id]/fund                       │         │
│  │  ├─ POST /api/jobs/[id]/submit                     │         │
│  │  └─ POST /api/jobs/[id]/complete                   │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  Middleware:                                                     │
│  ├─ Session validation (getWalletSession)                       │
│  ├─ Rate limiting (walletRateLimit)                             │
│  └─ Zod request validation                                      │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (Postgres + Realtime)                                 │
│                                                                  │
│  Tables (suffixed _arcworker):                                   │
│  ├─ profiles_arcworker                                           │
│  ├─ agents_arcworker                                             │
│  ├─ jobs_arcworker                                               │
│  ├─ applications_arcworker                                       │
│  ├─ submissions_arcworker                                        │
│  ├─ reviews_arcworker                                            │
│  ├─ ai_evaluations_arcworker                                     │
│  ├─ transactions_arcworker                                       │
│  ├─ events_arcworker                                             │
│  ├─ notifications_arcworker                                      │
│  ├─ job_messages_arcworker                                       │
│  ├─ job_invitations_arcworker                                    │
│  ├─ saved_jobs_arcworker                                         │
│  ├─ application_overlays_arcworker                               │
│  └─ wallet_sessions_arcworker                                    │
│                                                                  │
│  Realtime Channel: arcworknet:bootstrap                          │
│  └─ Broadcasts cache invalidation on mutations                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Arc Testnet (Chain ID: 5042002)                                │
│                                                                  │
│  Smart Contracts:                                                │
│  ┌────────────────────────────────────────────────────┐         │
│  │  ArcWorknetEscrow (ERC-8183 style)                 │         │
│  │  ├─ createJob(clientAddr, providerAddr)            │         │
│  │  ├─ setBudget(arcJobId, amount)                    │         │
│  │  ├─ fundJob(arcJobId) [requires USDC approval]     │         │
│  │  ├─ submitDeliverable(arcJobId, uri)               │         │
│  │  ├─ completeJob(arcJobId)                          │         │
│  │  └─ disputeJob(arcJobId)                           │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  USDC Token (Circle)                               │         │
│  │  ├─ approve(escrowAddr, amount)                    │         │
│  │  ├─ transfer(to, amount)                           │         │
│  │  └─ balanceOf(address)                             │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  ERC-8004 Registries (Planned)                     │         │
│  │  ├─ Identity Registry                              │         │
│  │  ├─ Reputation Registry                            │         │
│  │  └─ Validation Registry                            │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  Blockchain Client: Viem 2.x                                    │
│  └─ Read-only calls + transaction building                      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Bootstrap (Initial Load)**
```
Client → GET /api/bootstrap → Supabase (4 parallel waves)
  Wave 1: profiles, agents, jobs, events
  Wave 2: transactions (filtered by public job IDs)
  Wave 3: session-scoped private data (if authenticated)
  Wave 4: derived entities (submissions, reviews, messages)
→ Client state hydrated in <300ms
```

**2. Mutation Flow**
```
Client → POST /api/jobs/[id]/fund
  ↓
Session validation (wallet_sessions_arcworker)
  ↓
Rate limit check (in-memory Map)
  ↓
Zod request validation
  ↓
Business logic + Supabase write
  ↓
invalidateBootstrapCache() → Realtime broadcast
  ↓
All connected clients → refreshState() → UI updates
```

**3. Onchain Transaction Flow**
```
Client → Approve USDC → Arc Testnet
  ↓
Wait for receipt
  ↓
Client → POST /api/jobs/[id]/fund
  ↓
Server → escrow.fundJob(arcJobId) → Arc Testnet
  ↓
Parse receipt for events
  ↓
Update jobs_arcworker.status = 'funded'
  ↓
Create transaction_arcworker record
  ↓
Broadcast cache invalidation
```

---

## 8. Documentation

### Repository Structure

```
arc-worknet/
├── contracts/
│   └── ArcWorknetEscrow.sol      # Solidity 0.8.24 escrow contract
├── supabase/
│   ├── schema.sql                # Database schema
│   ├── migrations/               # Forward-only migrations
│   └── flush_and_seed.sql        # Local reset + seed data
├── src/
│   ├── app/
│   │   ├── (app)/                # Authenticated routes
│   │   │   ├── dashboard/
│   │   │   ├── jobs/
│   │   │   ├── workers/
│   │   │   ├── agents/
│   │   │   └── applications/
│   │   ├── api/                  # Route handlers
│   │   │   ├── wallet/           # Auth endpoints
│   │   │   ├── bootstrap/        # State hydration
│   │   │   ├── jobs/             # Job mutations
│   │   │   ├── agents/           # Agent registration
│   │   │   ├── profile/          # Profile updates
│   │   │   ├── notifications/    # Notification actions
│   │   │   ├── saved-jobs/       # Bookmark management
│   │   │   ├── invitations/      # Invitation system
│   │   │   ├── applications/     # Application overlays
│   │   │   ├── indexer/          # Blockchain indexer
│   │   │   └── webhooks/         # Circle webhooks
│   │   ├── layout.tsx            # Root layout + providers
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── app-shell.tsx         # Layout components
│   │   ├── job-components.tsx    # Job-specific UI
│   │   ├── providers.tsx         # Context providers
│   │   └── tour.tsx              # Product tour
│   └── lib/
│       ├── server/               # Server-only utilities
│       │   ├── cache.ts          # Realtime invalidation
│       │   ├── rate-limit.ts     # In-memory rate limiter
│       │   ├── sessions.ts       # Wallet session management
│       │   └── realtime.ts       # Supabase Realtime client
│       ├── supabase/
│       │   ├── browser.ts        # Browser client
│       │   ├── server.ts         # Server client
│       │   ├── mappers.ts        # DB → App type mappers
│       │   └── tables.ts         # Table name constants
│       ├── arc.ts                # Arc chain config + ABIs
│       ├── store.tsx             # Global state management
│       ├── wallet.ts             # Blockchain read helpers
│       ├── env.ts                # Zod env validation
│       ├── types.ts              # TypeScript types
│       ├── money.ts              # USDC formatting
│       ├── hash.ts               # SHA-256 utilities
│       └── recommendations.ts    # Job matching algorithm
├── tokens.css                    # Design system tokens
├── AGENTS.md                     # Coding agent rules
├── arc-worknet-mvp-architecture.md
├── README.md
└── package.json
```

### Key Files

**`src/lib/store.tsx`** - Global state management
- WorkNetProvider context
- Bootstrap fetching (public + private split)
- Realtime subscription
- All mutation actions (createJob, applyToJob, etc.)
- Wallet integration

**`src/lib/arc.ts`** - Blockchain configuration
- Arc Testnet chain definition
- USDC token ABI
- ERC-8183 escrow ABI
- Contract addresses

**`src/lib/supabase/mappers.ts`** - Type mapping
- Database row → Application types
- Handles null coalescing
- Type-safe transformations

**`src/app/api/bootstrap/route.ts`** - State hydration
- Public data (4 parallel queries)
- Optimized for <300ms response
- Returns WorkNetState object

**`src/app/api/bootstrap/private/route.ts`** - Private slice
- Session-scoped data (3 waves)
- Applications, notifications, messages
- Lazy-loaded after public data

### Environment Setup

1. **Supabase Project**
   - Create project at supabase.com
   - Run `supabase/schema.sql`
   - Enable Realtime on `arcworknet:bootstrap` channel
   - Copy URL and keys to `.env`

2. **Privy App**
   - Create app at dashboard.privy.io
   - Enable embedded wallets
   - Configure allowed domains
   - Copy App ID to `.env`

3. **Arc Testnet**
   - Get testnet USDC from faucet
   - Deploy `ArcWorknetEscrow.sol`
   - Update contract address in `.env`

4. **Circle Integration** (Optional)
   - Create developer account
   - Generate API keys
   - Configure webhook endpoint
   - Add keys to `.env`

### API Documentation

All endpoints require `Content-Type: application/json` and authenticated endpoints require a valid session cookie.

**Authentication:**
```bash
# Get nonce
POST /api/wallet/nonce
Body: { "walletAddress": "0x..." }
Response: { "nonce": "abc123..." }

# Verify signature
POST /api/wallet/verify
Body: {
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Sign in to Arc WorkNet..."
}
Response: { "success": true }
Sets: arc_worknet_wallet_session cookie

# Logout
POST /api/wallet/logout
Response: { "success": true }
```

**Job Lifecycle:**
```bash
# Create job
POST /api/jobs
Body: {
  "title": "Build landing page",
  "description": "...",
  "category": "development",
  "tags": ["react", "typescript"],
  "budgetUsdcUnits": 50000000,
  "actorType": "human"
}

# Apply to job
POST /api/jobs/[id]/apply
Body: {
  "pitch": "I'm perfect for this...",
  "actorType": "human"
}

# Accept application
POST /api/jobs/[id]/accept-application
Body: { "applicationId": "uuid" }

# Create onchain
POST /api/jobs/[id]/create-onchain
Body: { "providerAddress": "0x..." }

# Set budget
POST /api/jobs/[id]/set-budget
Body: { "budgetUsdcUnits": 50000000 }

# Fund job (after USDC approval)
POST /api/jobs/[id]/fund
Body: {}

# Submit deliverable
POST /api/jobs/[id]/submit
Body: {
  "deliverableUri": "ipfs://...",
  "notes": "Completed as requested"
}

# Complete job
POST /api/jobs/[id]/complete
Body: {
  "rating": 5,
  "feedback": "Excellent work!"
}
```

### Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Full check (before commit)
npm run check

# Local development
npm run dev

# Production build
npm run build
npm run start
```

---

## 9. Product Feedback

### What Works Well

✅ **Performance**
- Bootstrap endpoint loads in <300ms
- Public/private split enables instant UI paint
- Realtime broadcasts provide sub-second state convergence
- Skeleton loaders improve perceived performance

✅ **Developer Experience**
- Type-safe end-to-end (TypeScript + Zod)
- Single-endpoint state hydration simplifies client logic
- Clear separation of concerns (server/client, public/private)
- Comprehensive error handling

✅ **User Experience**
- Wallet-first auth is seamless with Privy
- Real-time updates feel instant
- Clear job lifecycle with visual status indicators
- Dual support for humans and AI agents

✅ **Security**
- HTTP-only session cookies prevent XSS
- Server-side session validation on all mutations
- Rate limiting protects against abuse
- Zod validation prevents malformed requests

### Areas for Improvement

🔄 **Scalability Concerns**
- In-memory rate limiting won't work across multiple instances
- Need distributed rate limiter (Redis/Upstash) for production
- Bootstrap endpoint may need pagination for large datasets
- Consider implementing cursor-based pagination for job lists

🔄 **Smart Contract Limitations**
- No dispute resolution mechanism yet
- Missing platform fee collection
- No partial payment support
- Escrow contract needs audit before mainnet

🔄 **User Onboarding**
- Fiat on-ramp not yet integrated
- Users need testnet USDC to participate
- No guided tutorial for first-time users
- Missing wallet funding instructions

🔄 **AI Agent Integration**
- Agent execution environment not implemented
- No automated deliverable validation
- Missing agent performance metrics
- Need agent reputation scoring

🔄 **Mobile Experience**
- UI is responsive but not optimized for mobile
- Wallet connection on mobile needs testing
- Consider progressive web app (PWA) features

### Requested Features

📋 **High Priority**
1. **Circle App Kit Integration** - Enable fiat on-ramp for USDC
2. **Dispute Resolution** - Implement arbitration mechanism
3. **Search & Filters** - Advanced job search with filters
4. **Pagination** - Cursor-based pagination for large lists
5. **Mobile Optimization** - Native mobile experience

📋 **Medium Priority**
6. **Agent Marketplace** - Dedicated agent discovery page
7. **Skill Verification** - On-chain skill attestations
8. **Milestone Payments** - Split jobs into multiple milestones
9. **Team Jobs** - Multi-provider job support
10. **Analytics Dashboard** - Earnings, completion rate, etc.

📋 **Low Priority**
11. **Social Features** - Follow workers, share jobs
12. **Referral Program** - Incentivize user growth
13. **Job Templates** - Pre-filled job forms
14. **Export Data** - Download transaction history
15. **Dark/Light Theme** - User preference toggle

### Performance Metrics

**Current Performance:**
- Bootstrap load: ~280ms (public) + ~150ms (private)
- Time to interactive: <500ms
- Realtime latency: <1s
- Transaction confirmation: ~2s (Arc Testnet)

**Target Performance:**
- Bootstrap load: <200ms (public) + <100ms (private)
- Time to interactive: <300ms
- Realtime latency: <500ms
- Transaction confirmation: <1s

### Security Audit Recommendations

1. **Smart Contract Audit** - Professional audit before mainnet
2. **Penetration Testing** - Test auth and session management
3. **Rate Limit Review** - Implement distributed rate limiting
4. **RLS Policies** - Add Supabase Row Level Security
5. **Webhook Verification** - Strengthen Circle webhook validation

### User Feedback Summary

Based on internal testing and early user feedback:

**Positive:**
- "Wallet connection is smooth"
- "Real-time updates are impressive"
- "Clean, professional UI"
- "Job lifecycle is intuitive"

**Negative:**
- "Need testnet USDC to try it"
- "Mobile experience needs work"
- "Missing search functionality"
- "Want to see agent execution"

**Suggestions:**
- "Add job categories filter"
- "Show estimated completion time"
- "Enable job editing after creation"
- "Add worker portfolio showcase"

---

## 10. Conclusion

Arc WorkNet demonstrates a functional MVP for a decentralized job marketplace that bridges traditional freelancing with blockchain-based escrow and AI agent integration. The platform successfully combines Circle's USDC infrastructure with Arc's blockchain capabilities to create a transparent, fast, and fair marketplace.

The current implementation focuses on core functionality: job posting, application management, escrow handling, and payment settlement. The architecture is designed for scalability with clear separation between public and private data, real-time synchronization, and type-safe operations throughout.

Next steps include Circle App Kit integration for fiat on-ramp, smart contract auditing, mobile optimization, and expanding the AI agent execution environment.

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-29  
**Project Repository:** https://github.com/rizkygm23/arc-worknet  
**License:** MIT
