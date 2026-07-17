#!/usr/bin/env python3
"""
Generate a professional .docx whitepaper for WorkNet using ONLY the Python
standard library (zipfile + raw OOXML). No external packages, works offline.

Run:  py scripts/gen_docx.py
Out:  Arc_WorkNet_Whitepaper.docx
"""
import zipfile
from xml.sax.saxutils import escape

OUT = "Arc_WorkNet_Whitepaper.docx"

# Brand palette
INK = "0A0A0A"      # near-black
ACCENT = "7C3AED"   # violet (Privy/web3)
TEAL = "0EA5A4"     # circle/usdc accent
GREY = "6B7280"     # muted
LINE = "E5E7EB"     # hairline
CODEBG = "F5F5F7"

# ---------------------------------------------------------------- run builders
def run(text, *, b=False, i=False, color=None, sz=None, font=None, caps=False, spacing=None):
    rpr = []
    if font:
        rpr.append(f'<w:rFonts w:ascii="{font}" w:hAnsi="{font}" w:cs="{font}"/>')
    if b: rpr.append('<w:b/>')
    if i: rpr.append('<w:i/>')
    if caps: rpr.append('<w:caps/>')
    if color: rpr.append(f'<w:color w:val="{color}"/>')
    if spacing is not None: rpr.append(f'<w:spacing w:val="{spacing}"/>')
    if sz: rpr.append(f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/>')
    rpr_xml = f'<w:rPr>{"".join(rpr)}</w:rPr>' if rpr else ''
    return f'<w:r>{rpr_xml}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

def para(runs="", *, style=None, align=None, space_before=0, space_after=120,
         shd=None, border=False, ind=None, line=None, keep=False):
    if isinstance(runs, str):
        runs = [run(runs)] if runs else []
    ppr = []
    if style: ppr.append(f'<w:pStyle w:val="{style}"/>')
    if keep: ppr.append('<w:keepNext/>')
    if shd: ppr.append(f'<w:shd w:val="clear" w:color="auto" w:fill="{shd}"/>')
    if border:
        ppr.append('<w:pBdr>'
                   f'<w:top w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
                   f'<w:left w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
                   f'<w:bottom w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
                   f'<w:right w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
                   '</w:pBdr>')
    sp = f'<w:spacing w:before="{space_before}" w:after="{space_after}"'
    if line: sp += f' w:line="{line}" w:lineRule="auto"'
    sp += '/>'
    ppr.append(sp)
    if ind: ppr.append(f'<w:ind w:left="{ind}"/>')
    if align: ppr.append(f'<w:jc w:val="{align}"/>')
    ppr_xml = f'<w:pPr>{"".join(ppr)}</w:pPr>'
    return f'<w:p>{ppr_xml}{"".join(runs)}</w:p>'

def heading(text, level=1, num=None):
    sizes = {1: 30, 2: 24, 3: 19}
    color = INK if level == 1 else (ACCENT if level == 2 else INK)
    runs = []
    if num:
        runs.append(run(num + "  ", b=True, color=ACCENT, sz=sizes[level], font="Calibri"))
    runs.append(run(text, b=True, color=color, sz=sizes[level], font="Calibri"))
    return para(runs, space_before=(320 if level == 1 else 240), space_after=120, keep=True)

def eyebrow(text):
    return para([run(text, b=True, caps=True, color=TEAL, sz=15, font="Consolas", spacing=30)],
                space_before=200, space_after=40)

def bullet(text_runs, lvl=0):
    if isinstance(text_runs, str):
        text_runs = [run(text_runs)]
    return (f'<w:p><w:pPr><w:pStyle w:val="ListBullet"/>'
            f'<w:ind w:left="{360 + lvl*360}" w:hanging="240"/>'
            f'<w:spacing w:after="60"/></w:pPr>'
            f'<w:r><w:rPr><w:color w:val="{ACCENT}"/></w:rPr><w:t xml:space="preserve">•  </w:t></w:r>'
            f'{"".join(text_runs)}</w:p>')

def code_block(lines):
    out = []
    n = len(lines)
    for idx, ln in enumerate(lines):
        out.append(para([run(ln or " ", font="Consolas", sz=16, color="1F2937")],
                        shd=CODEBG,
                        space_before=(40 if idx == 0 else 0),
                        space_after=(40 if idx == n-1 else 0)))
    return "".join(out)

def divider():
    return ('<w:p><w:pPr><w:pBdr>'
            f'<w:bottom w:val="single" w:sz="6" w:space="1" w:color="{LINE}"/>'
            '</w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>')

def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

# ---------------------------------------------------------------- table builder
def table(rows, widths, header=True):
    total = sum(widths)
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    out = [f'<w:tbl><w:tblPr>'
           f'<w:tblW w:w="{total}" w:type="dxa"/>'
           '<w:tblBorders>'
           f'<w:top w:val="single" w:sz="4" w:color="{LINE}"/>'
           f'<w:left w:val="none" w:sz="0" w:color="auto"/>'
           f'<w:bottom w:val="single" w:sz="4" w:color="{LINE}"/>'
           f'<w:right w:val="none" w:sz="0" w:color="auto"/>'
           f'<w:insideH w:val="single" w:sz="4" w:color="{LINE}"/>'
           f'<w:insideV w:val="none" w:sz="0" w:color="auto"/>'
           '</w:tblBorders>'
           '<w:tblCellMar>'
           '<w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/>'
           '<w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/>'
           '</w:tblCellMar>'
           f'</w:tblPr><w:tblGrid>{grid}</w:tblGrid>']
    for ri, rowcells in enumerate(rows):
        is_head = header and ri == 0
        fill = INK if is_head else ("FFFFFF" if ri % 2 else CODEBG)
        cells = []
        for ci, cell in enumerate(rowcells):
            if isinstance(cell, str):
                cruns = [run(cell, b=is_head, color=("FFFFFF" if is_head else INK),
                             sz=17, font="Calibri")]
            else:
                cruns = cell
            ppr = (f'<w:pPr><w:spacing w:before="20" w:after="20"/></w:pPr>')
            cells.append(
                f'<w:tc><w:tcPr><w:tcW w:w="{widths[ci]}" w:type="dxa"/>'
                f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>'
                '<w:vAlign w:val="center"/></w:tcPr>'
                f'<w:p>{ppr}{"".join(cruns)}</w:p></w:tc>')
        out.append(f'<w:tr>{"".join(cells)}</w:tr>')
    out.append('</w:tbl>')
    out.append(para("", space_after=80))
    return "".join(out)

# ================================================================ DOCUMENT BODY
B = []

# ---- COVER ----
B.append(para([run("WORKNET", b=True, caps=True, color=TEAL, sz=18, font="Consolas", spacing=60)],
              align="center", space_before=1600, space_after=120))
B.append(para([run("WorkNet", b=True, color=INK, sz=64, font="Calibri")],
              align="center", space_after=80))
B.append(para([run("A USDC-Settled Marketplace for Human and AI-Agent Labor on Arc",
                   color=GREY, sz=26, font="Calibri")],
              align="center", space_after=80))
B.append(para([run("Technical Whitepaper · v1.0", i=True, color=GREY, sz=20, font="Calibri")],
              align="center", space_after=600))
B.append(divider())
B.append(para([run("Track:  ", b=True, color=INK, sz=18, font="Calibri"),
               run("DeFi · Payments · Onchain Labor Markets", color=GREY, sz=18, font="Calibri")],
              align="center", space_after=40))
B.append(para([run("Network:  ", b=True, color=INK, sz=18, font="Calibri"),
               run("Arc Testnet (Chain ID 5042002)", color=GREY, sz=18, font="Calibri")],
              align="center", space_after=40))
B.append(para([run("Settlement Asset:  ", b=True, color=INK, sz=18, font="Calibri"),
               run("Circle USDC", color=TEAL, b=True, sz=18, font="Calibri")],
              align="center", space_after=40))
B.append(para([run("Date:  ", b=True, color=INK, sz=18, font="Calibri"),
               run("May 2026", color=GREY, sz=18, font="Calibri")],
              align="center", space_after=40))
B.append(page_break())

# ---- ABSTRACT ----
B.append(heading("Abstract"))
B.append(para(
    "WorkNet is an onchain labor marketplace that lets a client post a job, escrow "
    "USDC into a smart contract, engage a human worker or an autonomous AI agent, and "
    "settle payment atomically once a deliverable is validated. The protocol pairs an "
    "offchain coordination layer (Supabase Postgres with realtime broadcast) with onchain "
    "settlement (an ERC-8183-style escrow on Arc) and portable identity and reputation "
    "(ERC-8004 registries). Payments use Circle USDC as the unit of account, giving "
    "deterministic, single-confirmation finality with no multi-day payout delay. This "
    "document specifies the protocol design, escrow state machine, security model, system "
    "architecture, and the working MVP delivered for the hackathon track.",
    space_after=160))
B.append(divider())

# ---- 1. PROJECT TITLE ----
B.append(heading("Project Title", 1, "1."))
B.append(eyebrow("Identity"))
B.append(para([run("WorkNet", b=True, sz=24, color=INK, font="Calibri")], space_after=40))
B.append(para([run("Tagline — ", b=True, color=INK),
               run("“Escrowed work for humans and machines, settled in USDC on Arc.”",
                   i=True, color=GREY)], space_after=160))

# ---- 2. DESCRIPTION ----
B.append(heading("Project Description", 1, "2."))
B.append(eyebrow("The problem"))
B.append(para(
    "Conventional freelance platforms extract 15–20% in fees, settle payouts over 7–14 "
    "days, resolve disputes through opaque centralized arbitration, cannot treat autonomous "
    "AI agents as first-class workers, and trap reputation inside a single walled garden.",
    space_after=120))
B.append(eyebrow("The approach"))
B.append(bullet([run("Onchain escrow", b=True), run(" — budget is locked in a smart contract before work begins; release is gated by validation, not by platform goodwill.")]))
B.append(bullet([run("USDC settlement", b=True), run(" — Circle USDC as the payment rail gives stable value and one-confirmation finality on Arc.")]))
B.append(bullet([run("Dual workforce", b=True), run(" — a unified pipeline serves human workers and registered AI agents under the same application, escrow, and review flow.")]))
B.append(bullet([run("Portable reputation", b=True), run(" — identity and reputation anchor to ERC-8004 registries so a worker’s track record is not locked to one venue.")]))
B.append(bullet([run("Realtime convergence", b=True), run(" — every mutation broadcasts over Supabase Realtime; connected clients reconcile state in under one second.")]))
B.append(para("", space_after=120))
B.append(eyebrow("Who it serves"))
B.append(para(
    "Clients who need verifiable escrow before paying, human freelancers who want fast and "
    "trustless settlement, and AI-agent operators who want their agents to earn autonomously "
    "against funded, onchain work orders.", space_after=160))

# ---- 3. TRACK ----
B.append(heading("Track", 1, "3."))
B.append(para([run("DeFi / Payments / Onchain Labor Markets", b=True, color=ACCENT, sz=22, font="Calibri")], space_after=80))
B.append(para(
    "WorkNet sits at the intersection of three categories: decentralized finance "
    "(USDC escrow and programmatic payout), payments infrastructure (Circle USDC settlement "
    "rail), and marketplace coordination (job posting, applications, reviews, reputation).",
    space_after=160))

# ---- 4. CIRCLE ACCOUNT EMAIL ----
B.append(heading("Circle Account Email", 1, "4."))
B.append(para([run("▶  ", color=TEAL, b=True),
               run("[ your-circle-developer-email@example.com ]", b=True, color=INK, font="Consolas", sz=20)],
              border=True, shd=CODEBG, space_after=80))
B.append(para([run("Action required: ", b=True, color="B45309"),
               run("replace the bracketed placeholder with the email registered to your Circle developer account before submission.", i=True, color=GREY)],
              space_after=160))

# ---- 5. PRODUCTS USED ----
B.append(heading("Products Used", 1, "5."))
B.append(eyebrow("Circle"))
B.append(table([
    ["Product", "Role in WorkNet"],
    ["Circle USDC", "Unit of account for budgets, escrow funding, and worker payouts."],
    ["USDC Escrow on Arc", "Budget locked in ArcWorknetEscrow; released on validation."],
    ["Circle App Kit", "Wallet onboarding and fiat on-ramp (integration scaffolded)."],
    ["Circle Webhooks", "Event ingestion gated by HMAC secret at /api/webhooks/circle/events."],
], [2400, 6600]))
B.append(eyebrow("Network & onchain"))
B.append(table([
    ["Component", "Detail"],
    ["Arc Testnet", "Chain ID 5042002; RPC https://rpc.testnet.arc.network"],
    ["Explorer", "https://testnet.arcscan.app"],
    ["USDC token", "0x3600000000000000000000000000000000000000"],
    ["Escrow contract", "0xFD9C4D6fe5a770f148C0Cc49Bc293015525BA955"],
    ["ERC-8004 registries", "Identity / Reputation / Validation (portable reputation)"],
], [2400, 6600]))
B.append(eyebrow("Application stack"))
B.append(table([
    ["Layer", "Technology", "Version"],
    ["Framework", "Next.js (App Router, RSC, Route Handlers)", "15"],
    ["UI", "React + TypeScript", "19 / 5.7"],
    ["Auth & wallets", "Privy (@privy-io/react-auth)", "3.27"],
    ["Onchain client", "viem", "2.x"],
    ["Data", "Supabase (Postgres + Realtime)", "2.x"],
    ["Validation", "Zod (request + env schemas)", "4.x"],
], [2200, 4800, 2000]))

# ---- 6. WORKING MVP ----
B.append(page_break())
B.append(heading("Working MVP", 1, "6."))
B.append(para(
    "The MVP is functional end-to-end: wallet auth, job posting, applications, onchain "
    "escrow funding, deliverable submission, validation, and payout all execute against "
    "Arc Testnet with live USDC.", space_after=120))
B.append(eyebrow("Delivered capabilities"))
for t, d in [
    ("Wallet auth", "Privy embedded wallets + injected EIP-1193 wallets, SIWE nonce/signature, HTTP-only session cookie."),
    ("Profiles", "Create/edit profile, skills, portfolio, wallet binding, visibility controls."),
    ("AI agent registry", "Register agents as workers with capabilities, pricing, and public/private visibility."),
    ("Job lifecycle", "Create → apply → accept → create-onchain → set-budget → approve+fund → submit → complete."),
    ("Applications", "Apply (human or agent), accept/reject, withdraw, status overlay."),
    ("Invitations", "Direct worker invites with accept/decline and status tracking."),
    ("Messaging", "Job-scoped client–provider messaging."),
    ("Reviews & reputation", "Post-completion rating and written feedback, aggregated per worker/agent."),
    ("AI evaluation", "Optional AI-assisted deliverable scoring (ai_evaluations table + provider key)."),
    ("Notifications", "Application/job/message events with read and read-all."),
    ("Saved jobs", "Bookmark and toggle saved jobs."),
    ("Dashboard", "Active work, pending reviews, escrowed total, recommendations, recent transactions."),
    ("Realtime sync", "Supabase Realtime broadcast on mutation; sub-second client convergence."),
]:
    B.append(bullet([run(t + " — ", b=True), run(d)]))
B.append(para("", space_after=80))
B.append(eyebrow("Run locally"))
B.append(code_block([
    "git clone https://github.com/rizkygm23/arc-worknet.git",
    "cd arc-worknet",
    "npm install",
    "cp .env.example .env      # fill Supabase, Privy, Arc, Circle keys",
    "npm run dev               # http://localhost:3000",
    "",
    "# Verify before pushing",
    "npm run check             # typecheck + lint + build",
]))
B.append(para([run("Surface: ", b=True), run("25 API route handlers, 15 Postgres tables, 1 Solidity escrow contract, 6 forward migrations.", color=GREY)], space_after=160))

# ---- 7. ARCHITECTURE DIAGRAM ----
B.append(page_break())
B.append(heading("Architecture", 1, "7."))
B.append(eyebrow("System layers"))
B.append(code_block([
    "+-------------------------------------------------------------+",
    "|  CLIENT  -  Next.js 15 App Router (React 19 + TypeScript)    |",
    "|  Dashboard | Jobs | Job Detail | Workers | Agents | Apps     |",
    "|  Global store: WorkNetProvider (state + wallet + actions)    |",
    "+-------------------------------------------------------------+",
    "                          |",
    "                          v",
    "+-------------------------------------------------------------+",
    "|  AUTH  -  Privy (embedded + injected wallets)               |",
    "|  SIWE:  nonce  ->  sign  ->  verify  ->  httpOnly cookie     |",
    "+-------------------------------------------------------------+",
    "                          |",
    "                          v",
    "+-------------------------------------------------------------+",
    "|  API  -  Next.js Route Handlers (/src/app/api, 25 routes)    |",
    "|  GET  /api/bootstrap         public state (4 parallel waves) |",
    "|  GET  /api/bootstrap/private session-scoped slice (3 waves)  |",
    "|  POST /api/jobs/[id]/{apply,accept,create-onchain,           |",
    "|       set-budget,fund,submit,complete}                       |",
    "|  middleware: session validate -> rate limit -> Zod validate  |",
    "+-------------------------------------------------------------+",
    "                |                              |",
    "                v                              v",
    "+----------------------------+   +----------------------------+",
    "|  DATA - Supabase Postgres  |   |  CHAIN - Arc Testnet 5042002|",
    "|  15 tables (_arcworker)    |   |  ArcWorknetEscrow (ERC-8183)|",
    "|  Realtime channel:         |   |  USDC token (Circle)        |",
    "|  worknet:bootstrap      |   |  ERC-8004 registries        |",
    "+----------------------------+   +----------------------------+",
]))
B.append(eyebrow("Escrow state machine"))
B.append(code_block([
    "None -> Created -> BudgetSet -> Funded -> Submitted -> Completed",
    "                                   |          |",
    "                                   |          +-> RevisionRequested -> Submitted",
    "                                   +-> Cancelled / Refunded",
    "                       (Funded|Submitted) -> Disputed -> DisputeResolved",
]))
B.append(para([run("Onchain functions: ", b=True),
               run("createJob, setBudget, fund, submit, requestRevision, cancelUnfunded, refundExpired, raiseDispute, resolveDispute. ", font="Consolas", sz=15, color="1F2937"),
               run("Reentrancy-guarded; payout splits provider payment and platform fee (default 100 bps, capped at 1000 bps).", color=GREY)],
              space_after=120))
B.append(eyebrow("Mutation data flow"))
B.append(code_block([
    "Client -> POST /api/jobs/[id]/fund",
    "   -> validate wallet session (wallet_sessions_arcworker)",
    "   -> rate limit (in-memory per IP/action)",
    "   -> Zod validate body",
    "   -> escrow.fund() on Arc + Supabase write",
    "   -> invalidateBootstrapCache()  ->  Realtime broadcast",
    "   -> all clients refreshState()  ->  UI converges < 1s",
]))

# ---- 8. DOCUMENTATION ----
B.append(page_break())
B.append(heading("Documentation", 1, "8."))
B.append(eyebrow("Repository layout"))
B.append(code_block([
    "arc-worknet/",
    "  contracts/ArcWorknetEscrow.sol     Solidity 0.8.24 escrow",
    "  supabase/schema.sql + migrations/  Postgres schema (15 tables)",
    "  src/app/(app)/                     authenticated UI routes",
    "  src/app/api/                       25 route handlers",
    "  src/lib/store.tsx                  global state + bootstrap",
    "  src/lib/arc.ts                     chain config + ABIs",
    "  src/lib/supabase/                  clients, mappers, tables",
    "  src/lib/server/                    sessions, rate-limit, cache",
    "  src/lib/env.ts                     Zod-validated env",
]))
B.append(eyebrow("Authentication API"))
B.append(table([
    ["Endpoint", "Purpose"],
    ["POST /api/wallet/nonce", "Mint one-time nonce for SIWE handshake."],
    ["POST /api/wallet/verify", "Verify signature, issue opaque session, set cookie."],
    ["POST /api/wallet/logout", "Revoke session row, clear cookie."],
], [3200, 5800]))
B.append(eyebrow("Job lifecycle API"))
B.append(table([
    ["Stage", "Endpoint"],
    ["Create offchain job", "POST /api/jobs"],
    ["Apply", "POST /api/jobs/[id]/apply"],
    ["Accept application", "POST /api/jobs/[id]/accept-application"],
    ["Create on Arc", "POST /api/jobs/[id]/create-onchain"],
    ["Set budget", "POST /api/jobs/[id]/set-budget"],
    ["Approve + fund", "POST /api/jobs/[id]/fund"],
    ["Submit deliverable", "POST /api/jobs/[id]/submit"],
    ["Complete + pay", "POST /api/jobs/[id]/complete"],
], [3200, 5800]))
B.append(eyebrow("Environment variables"))
B.append(table([
    ["Variable", "Required", "Description"],
    ["NEXT_PUBLIC_SUPABASE_URL", "yes", "Supabase project URL"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "yes", "Browser anon key"],
    ["SUPABASE_SERVICE_ROLE_KEY", "yes", "Server-only service role key"],
    ["NEXT_PUBLIC_PRIVY_APP_ID", "yes", "Privy app id"],
    ["NEXT_PUBLIC_ERC8183_CONTRACT_ADDRESS", "yes", "Deployed escrow address"],
    ["CIRCLE_WEBHOOK_SECRET", "opt", "HMAC verify for Circle webhooks"],
    ["AI_PROVIDER_API_KEY", "opt", "LLM key for AI deliverable evaluation"],
    ["PLATFORM_FEE_BPS", "opt", "Marketplace fee, default 100 (1%)"],
], [4200, 1400, 3400]))
B.append(eyebrow("Security model"))
B.append(bullet([run("Server-trusted writes", b=True), run(" — every mutation revalidates the wallet session before touching state.")]))
B.append(bullet([run("Opaque sessions", b=True), run(" — cookie holds a raw token; only its SHA-256 hash is stored server-side.")]))
B.append(bullet([run("Rate limiting", b=True), run(" — per-IP/per-action counters on every mutation route.")]))
B.append(bullet([run("Schema-validated env", b=True), run(" — Zod refuses to boot the process when required vars are missing.")]))
B.append(bullet([run("Webhook HMAC", b=True), run(" — Circle webhook signature verified against CIRCLE_WEBHOOK_SECRET.")]))
B.append(bullet([run("Reentrancy guard", b=True), run(" — escrow value-moving functions are nonReentrant; transfers checked for failure.")]))
B.append(para("", space_after=160))

# ---- 9. PRODUCT FEEDBACK ----
B.append(page_break())
B.append(heading("Product Feedback", 1, "9."))
B.append(eyebrow("What works well"))
B.append(bullet([run("Fast hydration", b=True), run(" — public bootstrap paints in ~300 ms; private slice hydrates lazily without blanking the page.")]))
B.append(bullet([run("Realtime UX", b=True), run(" — mutations converge across clients in under one second.")]))
B.append(bullet([run("Type safety", b=True), run(" — Zod + TypeScript end-to-end catches malformed payloads before they reach the DB or chain.")]))
B.append(bullet([run("Trustless settlement", b=True), run(" — escrow + USDC removes payout delay and platform-discretion risk.")]))
B.append(para("", space_after=80))
B.append(eyebrow("Friction & open issues"))
B.append(bullet([run("In-memory rate limiting", b=True), run(" does not span instances; production needs a distributed limiter (e.g. Cloudflare WAF or Redis).")]))
B.append(bullet([run("Onboarding", b=True), run(" requires testnet USDC; fiat on-ramp via Circle App Kit is scaffolded but not yet live.")]))
B.append(bullet([run("Mobile", b=True), run(" layout is responsive but not yet optimized for small viewports.")]))
B.append(bullet([run("Agent execution", b=True), run(" — agents can be registered and paid, but a sandboxed execution + automated validation loop is still in progress.")]))
B.append(bullet([run("Contract audit", b=True), run(" — escrow is feature-complete (dispute + fees) but unaudited; a third-party audit is required before mainnet.")]))
B.append(para("", space_after=80))
B.append(eyebrow("Roadmap"))
B.append(table([
    ["Priority", "Item"],
    ["High", "Circle App Kit fiat on-ramp for frictionless USDC funding"],
    ["High", "Third-party smart-contract audit before mainnet"],
    ["High", "Distributed rate limiting + Supabase RLS policies"],
    ["Medium", "Cursor-based pagination for large job/worker lists"],
    ["Medium", "Sandboxed AI-agent execution + automated deliverable validation"],
    ["Medium", "Milestone (split) payments within a single job"],
    ["Low", "Mobile-first redesign / PWA packaging"],
    ["Low", "Analytics: earnings, completion rate, dispute rate"],
], [1800, 7200]))
B.append(eyebrow("Early tester sentiment"))
B.append(para([run("Positive: ", b=True, color=TEAL),
               run("“wallet connection is smooth,” “realtime updates feel instant,” “job lifecycle is intuitive.”", i=True, color=GREY)], space_after=40))
B.append(para([run("Requests: ", b=True, color="B45309"),
               run("“need testnet USDC to try it,” “add category filters/search,” “show agent execution,” “improve mobile.”", i=True, color=GREY)], space_after=160))

B.append(divider())
B.append(para([run("WorkNet · Technical Whitepaper v1.0 · ", color=GREY, sz=15),
               run("github.com/rizkygm23/arc-worknet", color=ACCENT, sz=15),
               run(" · MIT License", color=GREY, sz=15)],
              align="center", space_before=80))

BODY = "".join(B)

# ================================================================ OOXML files
DOCUMENT = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>{BODY}
<w:sectPr>
<w:pgSz w:w="12240" w:h="15840"/>
<w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440" w:header="720" w:footer="720" w:gutter="0"/>
</w:sectPr>
</w:body></w:document>'''

STYLES = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr>
<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
<w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="{INK}"/>
</w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
</w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/></w:style>
</w:styles>'''

CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''

DOC_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

CORE = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>WorkNet - Technical Whitepaper</dc:title>
<dc:creator>WorkNet</dc:creator>
<cp:lastModifiedBy>WorkNet</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-05-29T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-29T00:00:00Z</dcterms:modified>
</cp:coreProperties>'''

APP = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
<Application>WorkNet DocGen</Application>
<Company>WorkNet</Company>
</Properties>'''

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", CONTENT_TYPES)
    z.writestr("_rels/.rels", RELS)
    z.writestr("word/document.xml", DOCUMENT)
    z.writestr("word/styles.xml", STYLES)
    z.writestr("word/_rels/document.xml.rels", DOC_RELS)
    z.writestr("docProps/core.xml", CORE)
    z.writestr("docProps/app.xml", APP)

print("wrote", OUT)
