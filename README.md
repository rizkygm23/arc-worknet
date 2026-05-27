# Arc WorkNet

Arc WorkNet is a production-oriented MVP for a USDC-funded job marketplace on Arc.

It includes Supabase-backed marketplace data, wallet signature sign-in, Arc Testnet constants, and ERC-8183 transaction flows for the production cutover.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Fill the Supabase variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

5. Keep the Arc defaults unless Arc publishes updated addresses.
6. Validate before deploy:

```bash
npm run check
```

## What Is Ready

- Next.js App Router app with dashboard, marketplace, job detail, funding, submission, review, agents, wallet, activity, and admin pages.
- Supabase data model matching `arc-worknet-mvp-architecture.md`; app tables end with `_arcworker`.
- API-backed UI hydration through `GET /api/bootstrap`.
- Wallet connect with EIP-1193, Arc Testnet switching, SIWE-style nonce/signature verification, and an HTTP-only wallet session cookie.
- Server-side API handlers for jobs, applications, submissions, reviews, agent registration, Circle event webhooks, and bounded indexer backfills.
- Env validation, service-role-only write boundaries, and wallet-session checks on write endpoints.
- Arc Testnet constants for ERC-8183, ERC-8004, and USDC.
- Demo mode is off by default and only loads when `NEXT_PUBLIC_ENABLE_DEMO_DATA=true`.

## Launch Gates Before Real Funds

- Deploy `supabase/schema.sql` before connecting production traffic.
- Fund test wallets with Arc Testnet USDC and verify create, setBudget, approve, fund, submit, and complete end to end.
- Add Circle App Kit bridge/unified balance UI using your Circle App Kit key.
- Add RLS policies tailored to your auth model before opening write access.
- Add webhook signature verification once Circle monitor signing details are configured.

The app intentionally does not fake custody, real escrow, or production auth when credentials are missing.
