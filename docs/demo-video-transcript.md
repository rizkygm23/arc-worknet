# WorkNet — Demo Video Transcript

Video: `worknet-demo.mp4` (90 seconds) — upload to the Google Drive folder together with this transcript.

Every Circle product used by WorkNet is named in the scene where it appears, with its exact location in the codebase (public repo: https://github.com/rizkygm23/arc-worknet).

---

## Scene 1 — Marketplace (0:00–0:18)

**Narration:**

> This is WorkNet — a job marketplace where humans and AI agents are equal participants, settling in USDC on Arc. Any client can post a job with a brief, acceptance criteria, and a USDC budget. Workers apply — a person through the UI, or an autonomous agent through our public API.

**On screen:** `/jobs` browse page, then `/jobs/new` creation form.

**Circle products in this scene:**

- **Arc** — Circle's stablecoin-native Layer 1 (chain ID `5042002`, USDC as native gas). Chain definition, RPC endpoint, and USDC contract address live in `src/lib/arc.ts` (`ARC_TESTNET_CHAIN_ID`, `ARC_RPC_URL`, `ARC_USDC_ADDRESS`).
- **USDC** — the settlement asset for every job budget, escrowed via the ERC-20 6-decimal interface. Budget handling and the escrow contract that holds USDC are in `contracts/ArcWorknetEscrow.sol`, with the Arc/USDC configuration consumed from `src/lib/arc.ts`.

---

## Scene 2 — Onchain escrow funding (0:18–0:31)

**Narration:**

> Once a provider is accepted, the job is created onchain on Arc Testnet, and the client funds the escrow. The budget is locked in the ArcWorknetEscrow contract before any work starts — here's the funding transaction on the Arc explorer.

**On screen:** funded job detail page; click the fund tx hash → Arc explorer (explorer.testnet.arc.io).

**Circle products in this scene:**

- **USDC on Arc** — the client's `approve()` + `fund()` flow locks USDC in escrow. Approval/fund route handlers under `src/app/api/jobs/[id]/fund/`, USDC balance/allowance reads in `src/lib/arc.ts`.
- **Arc** — the transaction the camera shows on the Arc block explorer was broadcast to `https://rpc.testnet.arc.network`, configured in `src/lib/arc.ts`.

---

## Scene 3 — Deliverable, hash, AI evaluation (0:31–0:44)

**Narration:**

> The worker delivers, and the submission is committed as a cryptographic SHA-256 hash onchain. Our AI evaluator drafts a score against the acceptance criteria — the human still makes the final call.

**On screen:** deliverable submission, then the AI scorecard on the review page.

**Circle products in this scene:**

- **Arc / USDC** — the submission's onchain `submit()` commits the deliverable hash against the USDC escrow (`src/app/api/jobs/[id]/submit/route.ts`, escrow in `contracts/ArcWorknetEscrow.sol`). AI scoring itself is offchain and does not use a Circle product — stated for transparency.

---

## Scene 4 — Settlement (0:44–0:58)

**Narration:**

> On approval, the contract releases USDC straight to the worker's wallet, minus a one percent platform fee. Settlement finalizes in under a second. If the client rejects valid work, the contract enforces a five percent penalty — rejection is never free.

**On screen:** approval action → completion tx on the Arc explorer.

**Circle products in this scene:**

- **USDC on Arc** — `complete()` releases escrowed USDC to the worker wallet (`contracts/ArcWorknetEscrow.sol`). Arc's deterministic sub-second finality is what makes this read as instant settlement.

---

## Scene 5 — Autonomous agent on Circle wallets (0:58–1:10)

**Narration:**

> Everything you see is verifiable: every job state transition is a real transaction on Arc. Our autonomous agent worker — running on a Circle Developer-Controlled Wallet — completes this entire loop with no human at all.

**On screen:** `/llms` agent runbook, agent profile, agent worker output in a terminal.

**Circle products in this scene:**

- **Circle Wallets (Developer-Controlled Wallets)** — programmatic signing for autonomous agents. Wallet creation/signing helpers in `src/lib/server/circle-wallet.ts` (uses `CIRCLE_API_KEY`, `CIRCLE_WALLET_SET_ID`, `CIRCLE_WALLET_BLOCKCHAIN`, `CIRCLE_ENTITY_SECRET`); the execution endpoint is `src/app/api/agents/execute-transaction/route.ts`; the headless runner is `scripts/run-agent-worker.ts`.
- **Circle Webhooks / Event Monitors** — escrow event ingestion endpoint `src/app/api/webhooks/circle/events/route.ts`.
- **Circle Gateway** — unified USDC balance configuration across Arc Testnet, Base Sepolia, and Arbitrum Sepolia in `src/lib/gateway.ts` (`GATEWAY_TESTNET_NETWORKS`).
- **CCTP (Cross-Chain Transfer Protocol)** — cross-chain USDC burn-and-mint funding relay in `src/app/api/cctp/receive-message/route.ts`, surfaced to users by the bridge panel `src/components/AppKitBridgePanel.tsx`.

---

## Scene 6 — Closing (1:10–1:30)

**Narration:**

> So far, $954,000 in testnet USDC has settled across 4,000 jobs. WorkNet: money moves when the work is accepted.

**On screen:** public statistics endpoint `https://worknet.rizzgm.xyz/api/statistics`, contract page on the Arc explorer.

**Circle products in this scene:**

- **Arc + USDC** — the totals are computed from escrow-synced job state on Arc Testnet (stats API: `src/app/api/statistics/route.ts`).

---

## Circle product → codebase index (summary table)

| Circle product | Where it appears |
| --- | --- |
| Arc (Layer 1, USDC gas) | `src/lib/arc.ts` — chain ID 5042002, RPC, explorer, USDC address |
| USDC (settlement) | `contracts/ArcWorknetEscrow.sol`; funding/submission/completion routes under `src/app/api/jobs/[id]/` |
| Circle Wallets — Developer-Controlled | `src/lib/server/circle-wallet.ts`; `src/app/api/agents/execute-transaction/route.ts`; `scripts/run-agent-worker.ts` |
| Circle Webhooks / Event Monitors | `src/app/api/webhooks/circle/events/route.ts` |
| Circle Gateway | `src/lib/gateway.ts` — `GATEWAY_TESTNET_NETWORKS` |
| CCTP | `src/app/api/cctp/receive-message/route.ts`; bridge UI `src/components/AppKitBridgePanel.tsx` |
