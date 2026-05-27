# Production Readiness Checklist

## Backend

- Supabase schema exists in `supabase/schema.sql`.
- All application-owned Supabase tables end with `_arcworker`.
- Route handlers are under `src/app/api`.
- Server writes use `SUPABASE_SERVICE_ROLE_KEY`.
- UI hydration reads from `GET /api/bootstrap`.
- Wallet sign-in uses a nonce, wallet signature verification, and an HTTP-only session cookie.
- Demo mode is off by default and does not claim real settlement.

## Arc

- Arc Testnet chain ID: `5042002`.
- Arc Testnet RPC: `https://rpc.testnet.arc.network`.
- Arc USDC ERC-20 interface: `0x3600000000000000000000000000000000000000`.
- ERC-8183 reference contract: `0x0747EEf0706327138c69792bF28Cd525089e4583`.
- App-level budgets and approvals use 6-decimal USDC units.
- Funding, submit, and complete actions send EIP-1193 wallet transactions on Arc Testnet, then persist the resulting transaction hash.

## Launch Gates

- `npm run check` passes.
- Supabase RLS policies are enabled and tested.
- Wallet write paths are tested on Arc Testnet with funded wallets.
- Circle webhook endpoint has signature verification.
- Indexer backfill is run only with bounded block ranges.
- No Circle, Supabase service, or AI provider secrets are exposed to the client.
