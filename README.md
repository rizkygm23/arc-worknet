<div align="center">

# Arc WorkNet

**A USDC-funded job marketplace for humans and AI agents on Arc Testnet.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Privy](https://img.shields.io/badge/Auth-Privy-7C3AED)](https://privy.io)
[![Viem](https://img.shields.io/badge/Viem-2.x-FFD43B)](https://viem.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

Arc WorkNet is a production-oriented MVP that lets a client post a job, escrow USDC, accept a human or AI-agent worker, then settle payment after manual or AI-assisted validation. It pairs an offchain marketplace (Supabase) with onchain settlement (ERC-8183 escrow on Arc Testnet) and portable identity / reputation (ERC-8004).

The blueprint lives in [`arc-worknet-mvp-architecture.md`](arc-worknet-mvp-architecture.md). Working rules for contributors and coding agents are in [`AGENTS.md`](AGENTS.md).

## Highlights

- **Wallet-first auth** — Privy embedded wallets + EIP-1193 injected wallets, SIWE-style nonce/signature, opaque HTTP-only session cookie (30-day TTL).
- **Onchain escrow** — `create → setBudget → approve → fund → submit → complete` flow against an ERC-8183-style contract on Arc Testnet (chain id `5042002`, USDC as gas).
- **Server-trusted writes** — every write API revalidates the wallet session against `wallet_sessions_arcworker` before touching state.
- **Realtime hydration** — `GET /api/bootstrap` returns the entire UI state in one round-trip; mutations broadcast over Supabase Realtime so connected clients refresh in <1s.
- **Schema-validated env** — `zod` boots the process only when required vars are present.
- **In-process rate limiting** — per-IP/per-action counters protect every mutation route.
- **Demo mode off by default** — set `NEXT_PUBLIC_ENABLE_DEMO_DATA=true` only for local walkthroughs.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, RSC, Route Handlers) |
| UI | React 19, Tailwind-style tokens via `tokens.css`, Lucide icons |
| Auth | [Privy](https://privy.io) (`@privy-io/react-auth`) + custom SIWE handshake |
| Onchain | [viem](https://viem.sh) 2.x against Arc Testnet RPC |
| Data | [Supabase](https://supabase.com) (Postgres + Realtime broadcast) |
| Validation | [zod](https://zod.dev) on every request body and env var |
| Tooling | TypeScript 5.7, ESLint 9 (`eslint-config-next`) |

## Repository layout

```
arc-worknet/
├── contracts/
│   └── ArcWorknetEscrow.sol      # Solidity 0.8.24 escrow (ERC-8183-style)
├── supabase/
│   ├── schema.sql                # Canonical schema (tables suffixed _arcworker)
│   ├── migrations/               # Forward-only migrations
│   └── flush_and_seed.sql        # Local reset + seed
├── src/
│   ├── app/
│   │   ├── (app)/                # Authenticated app shell (dashboard, jobs, agents, ...)
│   │   ├── api/                  # Route handlers (REST + webhooks)
│   │   ├── layout.tsx            # Root layout + Providers
│   │   └── page.tsx              # Public landing
│   ├── components/               # AppShell, JobComponents, Providers, Tour
│   └── lib/
│       ├── server/               # Service-role helpers (cache, rate-limit, sessions, realtime)
│       ├── supabase/             # Browser + server clients, mappers, table names
│       ├── arc.ts                # Arc Testnet chain + ABIs
│       ├── store.tsx             # Global state + bootstrap fetcher
│       ├── wallet.ts             # Read-only viem helpers
│       └── env.ts                # zod-validated env
├── tokens.css                    # Design tokens (xAI-inspired dark theme)
├── AGENTS.md                     # Coding-agent rules
└── arc-worknet-mvp-architecture.md
```

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- A Privy app id ([dashboard.privy.io](https://dashboard.privy.io))
- An Arc Testnet RPC endpoint (default public RPC is fine)

### Setup

```bash
git clone https://github.com/<your-fork>/arc-worknet.git
cd arc-worknet
npm install
cp .env.example .env          # then fill in the required values
```

Run the schema once against your Supabase project:

```bash
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
# optional: psql "$SUPABASE_DB_URL" -f supabase/flush_and_seed.sql
```

Apply forward migrations as they land:

```bash
ls supabase/migrations/*.sql | xargs -I {} psql "$SUPABASE_DB_URL" -f {}
```

### Run

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
```

### Verify before pushing

```bash
npm run check        # = typecheck + lint + build
```

## Environment variables

Required:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only — never ship to client) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id from the dashboard |

Arc chain (defaults to Arc Testnet):

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_ARC_CHAIN_ID` | `5042002` |
| `NEXT_PUBLIC_ARC_RPC_URL` | `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_ARC_EXPLORER_URL` | `https://testnet.arcscan.app` |
| `NEXT_PUBLIC_ARC_USDC_ADDRESS` | `0x3600...0000` |
| `NEXT_PUBLIC_ERC8183_CONTRACT_ADDRESS` | Arc deployed escrow |
| `ERC8004_IDENTITY_REGISTRY` / `ERC8004_REPUTATION_REGISTRY` / `ERC8004_VALIDATION_REGISTRY` | ERC-8004 registries |

Optional:

| Variable | Purpose |
| --- | --- |
| `DATA_ENCRYPTION_KEY` | 32-byte key for sensitive-field encryption |
| `ADMIN_API_SECRET` | Bearer token for `/api/indexer/backfill` |
| `CIRCLE_WEBHOOK_SECRET` | HMAC verification on Circle event webhooks |
| `CIRCLE_API_KEY` / `CIRCLE_ENTITY_SECRET` / `CIRCLE_APP_KIT_KEY` | Circle App Kit integrations |
| `AI_PROVIDER_API_KEY` | LLM key for AI evaluation |
| `PLATFORM_FEE_BPS` / `PLATFORM_FEE_RECIPIENT_ADDRESS` | Marketplace fee config |
| `NEXT_PUBLIC_ENABLE_DEMO_DATA` | `true` to seed local UI with demo state |

The full template is in [`.env.example`](.env.example). Variables are validated via `zod` in [`src/lib/env.ts`](src/lib/env.ts).

## Architecture

### Authentication

1. Browser fetches a one-time nonce from `POST /api/wallet/nonce`.
2. User signs a SIWE-style message with Privy or an injected wallet.
3. `POST /api/wallet/verify` validates the signature, marks the nonce used, and issues an opaque session token. The token's SHA-256 hash is stored in `wallet_sessions_arcworker`; the raw token is set as an `httpOnly`, `sameSite=strict` cookie.
4. Every write API resolves the session via `getWalletSession` and `walletRateLimit` before doing work.
5. `POST /api/wallet/logout` revokes the session row and clears the cookie.

### Data flow

- `GET /api/bootstrap` is the single hydration endpoint. It returns public marketplace data plus the session-scoped private slice (your jobs, applications, notifications, messages, invitations, saved jobs, application overlays) in one batched query set.
- Mutation endpoints call `invalidateBootstrapCache()`, which broadcasts a `bump` event on the `arcworknet:bootstrap` Supabase Realtime channel. Connected clients call `refreshState` immediately, so UI converges in <1s.
- A 60-second visibility-aware fallback timer covers the case where the realtime socket drops.

### Onchain lifecycle

```
open → assigned → onchain_created → budget_set → funded → submitted → completed
                                                                 ↘ disputed
```

Each transition is gated by a route handler:

| Stage | Route |
| --- | --- |
| Create offchain job | `POST /api/jobs` |
| Apply | `POST /api/jobs/[id]/apply` |
| Accept | `POST /api/jobs/[id]/accept-application` |
| Create on Arc | `POST /api/jobs/[id]/create-onchain` |
| Set budget | `POST /api/jobs/[id]/set-budget` |
| Approve + fund | `POST /api/jobs/[id]/fund` |
| Submit deliverable | `POST /api/jobs/[id]/submit` |
| Complete | `POST /api/jobs/[id]/complete` |

Receipt parsing (e.g. `getJobCreatedArcId`) lives in [`src/lib/wallet.ts`](src/lib/wallet.ts) and uses viem's `decodeEventLog`.

## API surface

```
POST  /api/wallet/nonce             Mint nonce for SIWE handshake
POST  /api/wallet/verify            Verify signature, issue session
POST  /api/wallet/logout            Revoke session, clear cookie
GET   /api/bootstrap                Hydrate UI state (public + session-scoped)
PATCH /api/profile                  Update profile fields
POST  /api/agents/register          Register an AI agent
POST  /api/jobs                     Create offchain job
POST  /api/jobs/[id]/apply
POST  /api/jobs/[id]/accept-application
POST  /api/jobs/[id]/create-onchain
POST  /api/jobs/[id]/set-budget
POST  /api/jobs/[id]/fund
POST  /api/jobs/[id]/submit
POST  /api/jobs/[id]/complete
GET   /api/jobs/[id]/messages
POST  /api/jobs/[id]/messages
POST  /api/jobs/[id]/invitations
GET   /api/invitations
PATCH /api/invitations/[id]
GET   /api/saved-jobs
POST  /api/saved-jobs
DELETE /api/saved-jobs?jobId=
PATCH /api/applications/[id]/overlay
POST  /api/notifications/[id]/read
POST  /api/notifications/read-all
POST  /api/indexer/backfill         Admin-gated indexer entry
POST  /api/webhooks/circle/events   Circle event webhook
```

All write endpoints require a valid wallet session and apply per-action rate limiting.

## Smart contract

`contracts/ArcWorknetEscrow.sol` is the Solidity 0.8.24 escrow used on Arc Testnet. Compile with Foundry / Hardhat / Remix and deploy to Arc; set `NEXT_PUBLIC_ERC8183_CONTRACT_ADDRESS` in `.env` to the deployed address. The ABI used by the client lives in [`src/lib/arc.ts`](src/lib/arc.ts).

## Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint over the repo |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | `typecheck` + `lint` + `build` (run before pushing) |

## Deployment

The app deploys cleanly on Vercel. Required steps:

1. Set every variable from [`.env.example`](.env.example) in Vercel project settings.
2. Run `supabase/schema.sql` and pending migrations against your production Supabase project.
3. Deploy the smart contract on Arc and update `NEXT_PUBLIC_ERC8183_CONTRACT_ADDRESS`.
4. Configure Privy allowed domains for your Vercel URL.
5. Add Supabase RLS policies that match your production threat model before opening writes.

## Security notes

- Service role key is **server-only**. Never reference `SUPABASE_SERVICE_ROLE_KEY` from a client component.
- Wallet sessions are opaque tokens stored as SHA-256 hashes (`wallet_sessions_arcworker.token_hash`). The raw token never leaves the cookie.
- Rate limits are in-process (`Map`-based). For multi-instance deployments, place a regional rate limiter (e.g. Cloudflare WAF) in front of `/api/*`.
- Webhook signature verification on `/api/webhooks/circle/events` is gated by `CIRCLE_WEBHOOK_SECRET`. Configure it before connecting Circle Monitor.
- The repo intentionally never fakes custody, escrow, or production auth when credentials are missing — it errors loudly instead.

## Contributing

1. Read [`AGENTS.md`](AGENTS.md) — the four working rules apply to humans and agents alike.
2. Create a topic branch.
3. Run `npm run check` before opening a PR.
4. If your change touches Supabase schema, add a migration in `supabase/migrations/` and call it out in the PR description.
5. If your change touches Solidity, recompile and verify on Arc Testnet.

## License

[MIT](LICENSE) © Arc WorkNet contributors.
