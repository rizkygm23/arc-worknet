# AGENTS.md

This repository is the WorkNet MVP application. Treat it as a production-oriented Next.js, Supabase, wallet-auth, and Arc smart-contract project.

## Source Of Truth

- Product architecture: `arc-worknet-mvp-architecture.md`
- Next.js application: `src/`
- Supabase schema and migrations: `supabase/schema.sql` and `supabase/migrations/`
- Smart contract source: `contracts/ArcWorknetEscrow.sol`
- Environment template: `.env.example`

The `skills/andrej-karpathy-skill/`, `.codex-plugin/`, `instruction.md`, and `EXAMPLES.md` files describe the coding-agent workflow used in this repo. They are not the product architecture for WorkNet.

## Working Rules

Apply the four coding checks from `skills/andrej-karpathy-skill/SKILL.md`:

- Think before coding: state the current assumption when the task has ambiguity.
- Keep it simple: implement the smallest production-safe change that satisfies the current request.
- Make surgical changes: touch only files related to the request and match local style.
- Define and verify the goal: run the narrowest meaningful check before calling work done.

## Product Constraints

- Do not reintroduce dummy data into production paths.
- Keep all Supabase table names suffixed with `_arcworker`.
- Wallet-authenticated write APIs must verify the connected wallet session.
- Onchain escrow actions must use the configured Arc contract address.
- Preserve the staged job lifecycle unless explicitly changing the smart contract flow:
  `open -> assigned -> onchain_created -> budget_set -> funded -> submitted -> completed/disputed`.
- Marketplace applications are offchain until a provider is accepted.
- Escrow settlement, revision, and dispute actions must be backed by smart-contract transactions.

## Verification

Before handing off a code change, prefer:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

If a change touches Supabase schema, add a migration in `supabase/migrations/` and mention that it must be applied to the live Supabase project.

If a change touches Solidity, compile `contracts/ArcWorknetEscrow.sol` with Solidity `0.8.24` or verify it in Remix.
