# Security Penetration Test Report

**Generated:** 2026-11-10 08:10:32 UTC

# Executive Summary

An external black-box assessment of the WorkNet platform (https://worknet.rizzgm.xyz) identified **one critical and one medium-severity vulnerability**, each fully validated with working proof-of-concept.

**Overall risk posture: Critical.** The platform's Supabase database (project `eldrxpulpluelgapyfjs`) is shared across multiple applications, and row-level security (RLS) was never enabled on the application tables. The Supabase anon key — public by design and embedded in the client JavaScript bundle — therefore grants unauthenticated internet users full read and write access to production tables, including other applications' user registries, session stores, and location data.

**Key findings**
- **Critical — Supabase anon key grants full CRUD across the shared database** (CVSS 10.0). Unauthenticated read of all session tokens (stored in plaintext; all currently expired), the full user registry, per-application user tables (including GPS coordinates and XP histories), and WorkNet job/agent runtime state; followed by demonstrated anonymous INSERT, UPDATE (including a `role_dc` privilege-flag change), and DELETE. Only the `api_keys` table has RLS enabled, proving the gap is a specific misconfiguration rather than a platform limitation.
- **Medium — Cross-account task-document disclosure** (CVSS 4.3). Any authenticated wallet can retrieve the client's uploaded task document (a 606KB PDF in the test) for any other user's job through `/api/jobs/{id}/task-file`; the signed download URL is issued without an ownership or applicant-relationship check.

**Business impact**
- Production data across the shared database is readable and modifiable by anyone on the internet with no credentials: compliance exposure (personal data including GPS coordinates) and integrity risk to user-facing records.
- Any future WorkNet/Privy login writes a fresh plaintext session token into an internet-readable table, keeping the exposure permanently live until RLS is enabled.

**Scope note:** a sibling application sharing the database was surfaced during testing (its user roster is exposed via the database issue above) but was confirmed by the client as out of scope; no testing conclusions for that property are included in this report.

**Business-logic and privileged flows** (escrow contract interactions, custodial wallet-transaction execution, paid x402 APIs) were boundary-tested and either correctly enforced authz or were disabled on this deployment (x402 endpoints return 503 "Paid API is not configured"). WorkNet's own authentication model was **not** broken: SIWE/Privy sessions are stored separately from the leaked table, expired tokens are rejected at runtime, logout revokes sessions, and object-level checks on jobs/agents/wallets held against systematic IDOR/BFLA/privilege-escalation testing.

# Methodology

**Engagement type:** External black-box assessment. **Scope:** https://worknet.rizzgm.xyz (primary), its API and backend infrastructure. A sibling application sharing the backend was confirmed out of scope by the client mid-engagement and excluded from conclusions.

**Framework:** OWASP Web Security Testing Guide (WSTG), with API-Top-10-style authorization testing on the documented API surface.

**Approach**
1. **Reconnaissance and attack-surface mapping** — DNS/CT-log enumeration, port and service fingerprinting, technology identification (Next.js on Vercel, Supabase PostgREST backend, Privy/SIWE wallet auth, Arc testnet escrow contract, Circle custodial wallets), bounded content discovery, full JS-bundle analysis (2.2MB of bundles), and analysis of the public agent runbook (`/llms.txt`) documenting ~20 API routes.
2. **Threat modeling** — written from recon evidence and amended live as validation disproved or extended each assumption (e.g. the initial "live session takeover" reading was corrected once runtime token-expiry enforcement was proven).
3. **Systematic vulnerability testing** — targeted validation per vulnerability family: Supabase direct-REST authorization (RLS/CRUD), authenticated IDOR/BFLA/business-logic on the app API (sessions, profiles, jobs, applications, submissions, agent registration/reputation, wallet balance, invitations, upload paths, x402 paid endpoints).
4. **Validation discipline** — every finding reproduced live with captured HTTP exchanges; counterevidence passes actively searched for controls that would neutralize each finding (per-table RLS behavior, cross-app session replay, caller-bound write checks, role markers); false positives from recon corrected and documented rather than inflated.
5. **Operational constraints honored** — the Vercel challenge WAF (burst-triggered, ~10-minute sticky block) was mapped and respected; all testing paced well above human-typical request intervals; production data untouched; all synthetic probe rows cleaned where the backend permitted deletion (some deletion residue flagged to the operator).

**Positive controls verified:** runtime session-expiry enforcement, logout session revocation, cookie transport flags, per-table RLS on `api_keys`, object-level binding on apply/submit/reputation/execute-transaction and wallet-balance flows, and genuine server-side route guards (not client-only) on the guarded pages.

# Technical Analysis

**Findings overview (severity model: exploitability × demonstrated impact)**

1. **Supabase anon-key full CRUD / RLS missing — CRITICAL (CVSS 10.0, scope-changed).** The anon key embedded in the public JS bundle reached production tables with no RLS: `sessions` (76 rows of plaintext tokens, all expired), `users` (WorkNet registry, Discord IDs, role markers), `users_learn` (sibling-app registry + XP/GPS data), `tasks` (365 rows), `projects`, plus other sibling tables (rain-monitoring users, DeFi market data). Anonymous INSERT into `sessions` succeeded (201), a role-marker UPDATE (`role_dc`: user→admin) on a probe row succeeded (later deleted), and DELETE succeeded on probe rows. Control contrast: `api_keys` rejects anon writes with RLS error 42501, confirming this is a per-table misconfiguration in a multi-app shared database. Expired tokens are rejected at runtime (WorkNet `/api/bootstrap/private` returns `session:null` for every leaked/forged token), so no live account-takeover chain exists today — but any future login writes a fresh plaintext token into an internet-readable table, keeping the exposure permanently live. CVSS scope is Changed because the blast radius crosses into sibling applications that never consented to WorkNet's key reaching their tables.

2. **Cross-account task-document read via `/api/jobs/{id}/task-file` — MEDIUM (CVSS 4.3, CWE-639).** Any authenticated wallet obtains a signed URL for any other user's job attachment; the document body (a 606KB PDF live) is disclosed. Counterevidence that lowers severity: attachment filename/path metadata is already public via job detail, so the incremental loss is the document content itself. Object binding on all sibling flows (apply, submit, reputation, execute-transaction, balance) proved correctly enforced.

**Out-of-scope observation (excluded from findings per client scope decision):** the sibling application sharing this database was reached during validation — its user roster is exposed through the database issue above, which is part of finding 1's impact. No conclusions about that property's own code are included.

**Systemic themes**
- **RLS as the only real boundary — and partially absent.** Supabase's contract (public anon key + enforced RLS) was applied inconsistently; one correctly-protected table amid many exposed ones indicates tables were created ad hoc.
- **Shared-backend blast radius.** Multiple apps on one database means one app's client-side key exposure is every app's exposure.
- **Runtime controls held where they existed:** token expiry enforcement, logout revocation, cookie flags, server-side auth gates, object-level API binding — the tested-secure surfaces are worth naming because they bound this report's severity honestly.

# Recommendations

**Immediate (treat as an active incident)**
1. **Enable RLS on every table the anon key can reach** (sessions, users, users_learn, tasks, projects, profiles_arcworker, jobs_arcworker, agents_arcworker, skills_arcworker, wallet_nonces_arcworker, rain_users, user_progress, markets_cherry, profiles_sd): owner-scoped SELECT/UPDATE policies at minimum, and deny all anon INSERT/UPDATE/DELETE. The `api_keys` table already demonstrates the correct policy pattern.
2. **Rotate and invalidate all session tokens**, since any of them may have been read or forged during the exposure window; move session storage to a server-only schema (or hashed tokens) outside PostgREST reach.
3. **Split the shared database into per-project schemas** (or separate projects) so one app's client-facing key cannot address sibling tables.

**Short-term**
4. Restrict `GET /api/bootstrap` — it currently returns a random recent profile to any unauthenticated caller with no cookie; require session context before returning profile data.
5. Close the `/api/jobs/{id}/task-file` IDOR: verify the requesting session owns the job or has an applicant relationship before minting the signed download URL.
6. Purge the residual test rows documented during the scan — anonymous DELETE on one table returns 204 but silently fails, suggesting a policy or trigger defect worth investigating in its own right.

**Retest guidance:** after RLS enablement, re-verify (a) anon REST reads/writes on every listed table return 401/403, (b) the task-file endpoint rejects non-owner/non-applicant sessions, and (c) existing login sessions on WorkNet continue to function (row-level policy changes can break legitimate paths silently).

