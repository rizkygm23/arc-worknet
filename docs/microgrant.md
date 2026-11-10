# WorkNet — Microgrant Application Kit (Oct 2026)

Short-form paste-ready answers untuk form microgrant Circle/Arc.
Versi panjang: `docs/grant.md`. Semua angka dari endpoint live
`https://worknet.rizzgm.xyz/api/statistics` (dicek 2026-10-28).

## Quick facts (paste ke kolom singkat)

| Field | Value |
| --- | --- |
| Project name | WorkNet |
| One-liner | AI-native freelance marketplace di mana manusia dan AI agent dikerjakan + dibayar sama: escrow USDC onchain di Arc, settlement sub-detik. |
| Live app | https://worknet.rizzgm.xyz |
| Public stats | https://worknet.rizzgm.xyz/api/statistics |
| Agent runbook (llms.txt) | https://worknet.rizzgm.xyz/llms |
| Escrow contract (Arc Testnet) | `0x1E40AE030e03E0a7E481046647B2a0E021F8A6F1` |
| Chain | Arc Testnet, chain ID 5042002 |
| Repo | https://github.com/rizkygm23/arc-worknet |
| Founder | Muhammad Rizky — Depok, West Java, Indonesia (not incorporated) |
| Track | Agentic Economy — autonomous agents transacting in USDC on Arc |

## Live traction (angka terbaru, grant.md sudah basi)

- **$954,667 USDC settled** — 4,040 jobs dibuat, 3,330 selesai (82.4% completion rate)
- 695 clients, 273 registered workers (human + AI agents)
- 4 known autonomous agents aktif via agent API keys
- Escrow contract live di Arc Testnet; semua payout onchain, terverifikasi via explorer

## Problem (short form)

Platform freelance kontemporal (Upwork/Fiverr) memotong 15–20% fee, settlement
lintas negara 7–14 hari, dan AI agents tidak bisa membuka rekening bank — mereka
terkunci dari ekonomi kerja sama sekali. Belum ada eskrow programmable bawaan
untuk workforce agenik.

## Solution (short form)

WorkNet mengunci budget di escrow USDC sebelum pekerjaan dimulai (custom
`ArcWorknetEscrow.sol` di Arc), endpoint pengerjaan yang dapat diautorisasi —
manusia (Privy embedded wallet) maupun AI agent (Circle Developer-Controlled
Wallet + API key), deliverable ter-hash onchain, plus AI evaluator berbasis
rubrik yang mendraft verdict sebelum rilis manual klien. Penolakan dikenakan
penalti 5% ke worker di smart contract sebagai proteksi eksploitasi.

## Why Arc / Circle products (short form)

- **USDC** sebagai native gas + settlement token (satu aset, dua tampilan) di `0x3600000000000000000000000000000000000000`
- **Developer-Controlled Wallets** — headless agent worker menandatangani transaksi submission/settlement tanpa browser
- **Circle Gateway / App Kit bridge** — client top-up escrow dari Base/Arbitrum/Ethereum tanpa keluar aplikasi
- **CCTP** — transfer lintas chain zero-slippage (CCTP domain 26)

## Use of funds (request $10,000 — sesuaikan dengan form)

| Alokasi | Jumlah | Keterangan |
| --- | --- | --- |
| Security audit escrow | $5,000 | Third-party audit `ArcWorknetEscrow.sol` sebelum mainnet |
| Infra & RPC | $3,000 | Hosting Next.js/Supabase, dedicated Arc RPC, monitoring |
| Builder incentives | $2,000 | USDC micro-grants untuk 3+ developer agent pihak ketiga |

## Milestones (garis besar — detail di grant.md)

1. **Bulan 1** — audit pihak ketiga tuntas temuan 0 critical/high, CI test suite (state-machine + E2E)
2. **Bulan 2** — deploy audited escrow ke Arc Mainnet, 100+ user, pembayaran USDC mainnet pertama
3. **Bulan 3** — Agent SDK di npm + OpenAPI docs, 3+ agent pihak ketiga mengerjakan job nyata
4. **Bulan 4** — reputasi onchain via ERC-8004, agent-as-client (A2A), micro-task Nanopayments

## Kolom yang HARUS diisi manual sebelum submit

- Email kontak aktif → grant.md masih `[your-email@example.com]`
- Link video demo → belum ada (transkrip tersedia: `docs/demo-video-transcript.md`)
- Link deck → belum ada (sumber: `docs/hackathon-presentation.md`)
- Domain produksi: grant.md menulis `worknet.xyz`, tapi app live di `worknet.rizzgm.xyz` — samakan dengan realita
- X handle `@WorkNet` masih placeholder — verifikasi
