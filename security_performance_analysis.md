# 🔐 Security & ⚡ Performance Analysis — WorkNet MVP

## Executive Summary

WorkNet is a well-structured Next.js + Supabase + wallet-auth application with generally **strong security fundamentals**. There are however several **critical-to-medium** security findings and notable performance bottlenecks that should be addressed before full production launch.

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| **Security** | 2 | 3 | 4 | 3 |
| **Performance** | 0 | 2 | 3 | 2 |

---

## 🔐 SECURITY ANALYSIS

---

### 🔴 CRITICAL

#### SEC-01: CCTP Bridge Relay Endpoint Has No Authentication
**File:** [route.ts](file:///c:/Users/HP/codingan/arc-worknet/src/app/api/cctp/receive-message/route.ts)

The `/api/cctp/receive-message` POST endpoint has **zero authentication**. Anyone can call it to trigger the relayer to send USDC from the server's relayer wallet to any `recipientAddress`.

```typescript
// No requireWalletSession(), no requireAdminSecret(), no webhook secret
export async function POST(request: Request) {
  const body = await request.json();
  // ... directly sends USDC using the relayer private key
}
```

**Impact:** An attacker can drain the relayer wallet by crafting requests with their own `recipientAddress`.

**Recommendation:**
- Add `requireWalletSession()` or `requireAdminSecret()` guard
- Verify the `burnTxHash` actually exists on the source chain BEFORE initiating the transfer
- Add rate limiting (currently missing)
- Verify the `recipientAddress` matches the caller's wallet session

---

#### SEC-02: Hardcoded Admin Wallet Address
**File:** [route.ts](file:///c:/Users/HP/codingan/arc-worknet/src/app/api/wallet/verify/route.ts#L82)

A specific wallet address is hardcoded to receive automatic admin role:

```typescript
const initialRole = address.toLowerCase() === "0xe27f8bad54cdfc3f81fb47531e853c9517ce035b".toLowerCase()
  ? "admin" : "client";
```

**Impact:** If this private key is compromised, the attacker gets permanent admin access. The address is visible in source code (public knowledge), making it a target.

**Recommendation:**
- Move admin addresses to environment variables (`ADMIN_WALLET_ADDRESSES`)
- Support multiple admin addresses via a comma-separated env var
- Add an audit log when admin role is auto-assigned

---

### 🟠 HIGH

#### SEC-03: Circle Webhook Secret Bypass
**File:** [api.ts](file:///c:/Users/HP/codingan/arc-worknet/src/lib/api.ts#L186-L205)

The `requireCircleWebhookSecret()` function silently allows requests through when:
1. `CIRCLE_WEBHOOK_SECRET` is not configured (returns `undefined`)
2. Request has `x-circle-signature` or `x-circle-key-id` headers (no actual verification)
3. No secret is provided in the request (returns `undefined`)

```typescript
export function requireCircleWebhookSecret(request: Request) {
  if (!env.CIRCLE_WEBHOOK_SECRET) return undefined; // PASS-THROUGH!

  if (request.headers.get("x-circle-signature") || 
      request.headers.get("x-circle-key-id")) {
    return undefined; // PASS-THROUGH without verifying signature!
  }

  const provided = requestSecret(request);
  if (!provided) return undefined; // PASS-THROUGH if no secret provided!
  // ...
}
```

**Impact:** Attacker can forge Circle webhook events by simply setting a `x-circle-signature` header to any value, inserting arbitrary events into the database.

**Recommendation:**
- Actually verify Circle's ECDSA webhook signature using their public key
- Return 401 when no secret is provided (not undefined)
- Never pass through when `CIRCLE_WEBHOOK_SECRET` is unconfigured in production

---

#### SEC-04: Rate Limiter Disabled in Test Mode (Leaks to Production)
**File:** [rate-limit.ts](file:///c:/Users/HP/codingan/arc-worknet/src/lib/server/rate-limit.ts#L39-L41)

```typescript
if (process.env.CYPRESS_TEST_CLIENT_PRIVATE_KEY || process.env.CYPRESS_ACTIVE_ROLE) {
  return undefined; // Rate limiting completely disabled
}
```

**Impact:** If `CYPRESS_TEST_CLIENT_PRIVATE_KEY` or `CYPRESS_ACTIVE_ROLE` env vars are accidentally set in production (e.g., from CI/CD leakage), all rate limiting is disabled.

**Recommendation:**
- Guard with `process.env.NODE_ENV !== "production"` check
- Or use a dedicated `DISABLE_RATE_LIMIT` env var that's blocked at the deployment level

---

#### SEC-05: Agent Execute Transaction — ABI Function Injection
**File:** [route.ts](file:///c:/Users/HP/codingan/arc-worknet/src/app/api/agents/execute-transaction/route.ts#L68)

```typescript
const data = encodeFunctionData({
  abi: [parseAbiItem(`function ${abiFunctionSignature}`)],
  args: abiParameters,
  //...
});
```

The `abiFunctionSignature` is user-supplied and only validated as `z.string().min(3)`. This could potentially be exploited to craft unexpected contract calls.

**Impact:** While ownership check exists (line 39), a malicious agent owner could call ANY contract function on ANY contract address using their agent's Circle wallet.

**Recommendation:**
- Whitelist allowed contract addresses (escrow contract only)
- Whitelist allowed function signatures (e.g., `approve`, `deposit`, `submitDeliverable`)
- Add a stricter regex for `abiFunctionSignature`

---

### 🟡 MEDIUM

#### SEC-06: PostgREST Filter Injection via Search
**File:** [route.ts](file:///c:/Users/HP/codingan/arc-worknet/src/app/api/jobs/route.ts#L81)

```typescript
if (search) query = query.ilike("title", `%${search.slice(0, 100)}%`);
```

While Supabase client parameterizes most queries, `ilike` with user input embedded in the pattern can cause unexpected matching with `%` and `_` wildcards from user input.

**Recommendation:** Escape `%` and `_` characters in search input before passing to `ilike`.

---

#### SEC-07: Session Token Stored in Cookie Without Rotation
**File:** [wallet-session.ts](file:///c:/Users/HP/codingan/arc-worknet/src/lib/server/wallet-session.ts)

Session tokens have a **30-day TTL** with no rotation mechanism. The `SHA-256` hash is stored server-side (good), but there's no:
- Token rotation on sensitive actions
- Concurrent session limits
- IP binding or device fingerprinting

**Recommendation:**
- Rotate token after role changes or sensitive operations
- Add `limit 5` on active sessions per profile
- Consider shorter TTL (7 days) with refresh mechanism

---

#### SEC-08: In-Memory Rate Limiter Not Shared Across Instances
**File:** [rate-limit.ts](file:///c:/Users/HP/codingan/arc-worknet/src/lib/server/rate-limit.ts)

Rate limiting uses an in-memory `Map`. On Vercel/multi-instance deployments, each serverless instance has its own counter. An attacker can bypass limits by getting routed to different instances.

**Recommendation:**
- Use Vercel KV or Upstash Redis for distributed rate limiting
- Or use Vercel's built-in edge rate limiting

---

#### SEC-09: Missing CSRF Protection on State-Changing Cookie-Auth Endpoints
The app uses `sameSite: "strict"` on cookies (good), but `SameSite=Strict` can be bypassed in some scenarios. No explicit CSRF token is verified on POST/PATCH/DELETE endpoints.

**Recommendation:** Add a `X-Requested-With` header check or implement double-submit cookie pattern.

---

### 🟢 LOW

#### SEC-10: Error Messages Leak Internal Details
Several API routes return raw Supabase error messages:
```typescript
if (error) return NextResponse.json({ error: error.message }, { status: 500 });
```

**Recommendation:** Log the full error server-side, return generic message to client.

---

#### SEC-11: `unsafe-inline` and `unsafe-eval` in CSP
**File:** [next.config.ts](file:///c:/Users/HP/codingan/arc-worknet/next.config.ts#L44)

```
script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
```

This weakens XSS protection significantly. Required by Privy/wallet SDKs, but worth documenting as accepted risk.

---

#### SEC-12: No `dangerouslySetInnerHTML` Usage (✅ Good)
No instances of `dangerouslySetInnerHTML` found. React's default escaping handles XSS in JSX.

---

### ✅ Security Strengths

| Area | Implementation | Grade |
|------|----------------|-------|
| **Input Validation** | Zod schemas on all API routes | ✅ A |
| **Auth Guards** | `requireWalletSession()` on all write APIs | ✅ A |
| **Session Hashing** | SHA-256 hashed tokens (not plaintext) | ✅ A |
| **Cookie Security** | `httpOnly`, `sameSite: strict`, `secure` in prod | ✅ A |
| **Secret Comparison** | `timingSafeEqual` for API secrets | ✅ A |
| **No XSS Vectors** | No `dangerouslySetInnerHTML`, no raw HTML injection | ✅ A |
| **Security Headers** | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | ✅ A |
| **`poweredByHeader: false`** | Disables `X-Powered-By` header | ✅ A |
| **Encryption at Rest** | AES-256-GCM for sensitive data with authenticated encryption | ✅ A |
| **Service Role Key Validation** | Checks that anon key isn't used as service key | ✅ A |
| **Owner-Based Authorization** | `agent.owner_profile_id !== session.profileId` checks | ✅ A |

---

## ⚡ PERFORMANCE ANALYSIS

---

### 🟠 HIGH

#### PERF-01: Monolithic Client-Side Store (50KB source, ~1,400 lines)
**File:** [store.tsx](file:///c:/Users/HP/codingan/arc-worknet/src/lib/store.tsx) — **50KB / 1,405 lines**

The entire application state is managed in a single `store.tsx` file with:
- Wallet state, data state, and actions all in one React context
- Every state update re-renders every consumer (no selector-based subscriptions)
- `useWorkNet()` is used across 20+ pages — any state change causes cascading re-renders

```
store.tsx → 50KB source
├── DataContext (jobs, profiles, agents, notifications, etc.)
├── WalletContext (wallet connection state)
└── ActionsContext (createJob, submitDeliverable, etc.)
```

**Impact:** Heavy re-renders on every state change, especially during wallet balance polling.

**Recommendation:**
- Split into 3 separate context providers (already structurally separated, but consumed via single `useWorkNet()`)
- Use `useSyncExternalStore` or Zustand with selectors for granular subscriptions
- Or at minimum, memoize derived values with `useMemo` in consumers

---

#### PERF-02: All Pages Are Client Components (`"use client"`)
**21 pages** are all marked as `"use client"`. This means:
- Zero server-side rendering for any page content
- Full React bundle must download before any page renders
- No streaming/suspense benefits from Next.js App Router

**Impact:** Slow First Contentful Paint (FCP) and Largest Contentful Paint (LCP), especially on mobile.

**Recommendation:**
- Move data display pages (jobs list, workers, agents) to Server Components
- Keep interactive forms as client components
- Use `Suspense` boundaries for progressive loading

---

### 🟡 MEDIUM

#### PERF-03: No Dynamic Imports / Code Splitting
Zero usage of `React.lazy()`, `next/dynamic`, or dynamic `import()` found. The entire component tree is eagerly loaded.

**Impact:** Landing page ([landing.tsx](file:///c:/Users/HP/codingan/arc-worknet/src/components/landing.tsx) — **47KB**), admin pages, and rarely-visited pages all contribute to initial bundle.

**Recommendation:**
```typescript
const AdminJobsPage = dynamic(() => import('./admin/jobs/page'), { ssr: false });
const LandingPage = dynamic(() => import('@/components/landing'), { loading: () => <Skeleton /> });
```

---

#### PERF-04: Bootstrap Endpoint Fetches Everything at Once
**File:** [route.ts](file:///c:/Users/HP/codingan/arc-worknet/src/app/api/bootstrap/route.ts)

Public bootstrap fetches **200 profiles + 200 agents + 200 jobs + 200 events + all skills + 100 transactions** in a single request.

**File:** [route.ts](file:///c:/Users/HP/codingan/arc-worknet/src/app/api/bootstrap/private/route.ts)

Private bootstrap does **3 waves** of parallel queries (Wave 1: 8 queries, Wave 2: 9 queries, Wave 3: conditional 5 queries).

**Impact:** Large JSON payloads (~100-500KB) on every session start. Slow Time to Interactive.

**Recommendation:**
- Implement incremental loading (load jobs page by page)
- Use the existing paginated `/api/jobs` endpoint instead of bootstrap for job listings
- Consider `transfer-encoding: chunked` or streaming JSON

---

#### PERF-05: 60-Second Polling Fallback + Realtime Channel
**File:** [store.tsx](file:///c:/Users/HP/codingan/arc-worknet/src/lib/store.tsx#L511-L515)

A `setInterval` polls the full bootstrap endpoint every 60 seconds as a fallback for Supabase Realtime. This is fine, but when combined with the large bootstrap payload, it adds sustained load.

**Recommendation:** Use `ETag` / `304 Not Modified` (partially implemented on public bootstrap ✅) — extend this to the private bootstrap as well.

---

### 🟢 LOW

#### PERF-06: No `React.memo` Usage
Zero usage of `React.memo()` across all components. Given the monolithic store that re-renders everything, this compounds performance issues on complex pages.

---

#### PERF-07: CSS File is 80KB / 3,647 Lines
**File:** [globals.css](file:///c:/Users/HP/codingan/arc-worknet/src/app/globals.css) — **80KB**

While Tailwind handles tree-shaking at build time, the custom CSS in this file is very large. Consider splitting into per-feature CSS modules.

---

### ✅ Performance Strengths

| Area | Implementation | Grade |
|------|----------------|-------|
| **In-Memory Caching** | Public bootstrap cached with 10s TTL + ETag | ✅ A |
| **ETag / 304 Support** | Public bootstrap returns `304 Not Modified` | ✅ A |
| **Parallel DB Queries** | `Promise.all` for batch Supabase queries | ✅ A |
| **Cursor Pagination** | Jobs API uses proper keyset pagination | ✅ A |
| **Realtime Updates** | Supabase Realtime channels for live data | ✅ A |
| **Visibility Check** | Polling skipped when tab is hidden | ✅ A |
| **Session Cache** | 30s in-memory wallet session cache | ✅ B+ |

---

## 📊 Priority Action Plan

### Immediate (Before Production Launch)
| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | **SEC-01:** Add auth to CCTP bridge endpoint | 🔴 Critical | Low |
| 2 | **SEC-02:** Move admin address to env var | 🔴 Critical | Low |
| 3 | **SEC-03:** Fix Circle webhook signature verification | 🟠 High | Medium |
| 4 | **SEC-04:** Guard rate limiter bypass with NODE_ENV check | 🟠 High | Low |

### Short-Term (Sprint 1-2)
| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 5 | **SEC-05:** Whitelist contract addresses for agent execution | 🟠 High | Medium |
| 6 | **PERF-01:** Split store into separate contexts | 🟠 High | High |
| 7 | **PERF-02:** Convert read-only pages to Server Components | 🟠 High | High |

### Medium-Term (Sprint 3-4)
| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 8 | **SEC-06:** Escape search wildcards | 🟡 Medium | Low |
| 9 | **SEC-07:** Add session rotation | 🟡 Medium | Medium |
| 10 | **SEC-08:** Move rate limiter to Redis | 🟡 Medium | Medium |
| 11 | **PERF-03:** Add dynamic imports for heavy pages | 🟡 Medium | Low |
| 12 | **PERF-04:** Incremental data loading | 🟡 Medium | High |
