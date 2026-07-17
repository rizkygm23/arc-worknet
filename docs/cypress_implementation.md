# Cypress E2E Implementation Guide

> **Audience**: AI coding agents and developers setting up Cypress from scratch on a Next.js + Vercel + Supabase project.
> **Based on**: Battle-tested implementation from the WorkNet MVP.
> **Last verified**: July 2026, Cypress v15.x, Next.js 15.x, Node 22.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Installation](#2-installation)
3. [Project Structure](#3-project-structure)
4. [cypress.config.ts — The Configuration File](#4-cypressconfigts--the-configuration-file)
5. [TypeScript Configuration](#5-typescript-configuration)
6. [Support File (cypress/support/e2e.ts)](#6-support-file-cypresssupporte2ets)
7. [Writing Test Specs](#7-writing-test-specs)
8. [Custom Commands](#8-custom-commands)
9. [Environment Variables](#9-environment-variables)
10. [CI/CD with GitHub Actions](#10-cicd-with-github-actions)
11. [Vercel Preview Deployment Testing](#11-vercel-preview-deployment-testing)
12. [Common Pitfalls & Solutions](#12-common-pitfalls--solutions)
13. [Troubleshooting Checklist](#13-troubleshooting-checklist)
14. [Checklist — Copy-Paste Ready](#14-checklist--copy-paste-ready)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions CI                     │
│                                                         │
│  1. Checkout repo                                       │
│  2. Setup Node.js (v22) + npm cache                     │
│  3. npm install                                         │
│  4. Wait for Vercel Preview deployment                  │
│  5. Run Cypress against Vercel Preview URL              │
│  6. Upload screenshots/videos on failure                │
└────────────┬───────────────────────────────┬────────────┘
             │                               │
             ▼                               ▼
   ┌──────────────────┐           ┌──────────────────┐
   │  Vercel Preview   │           │  Cypress Runner   │
   │  (deployed app)   │◄──────────│  (Chrome browser) │
   │                   │  HTTP     │                   │
   └──────────────────┘           └──────────────────┘
```

**Key principle**: Cypress tests run against a **deployed** Vercel preview URL (not localhost) in CI. Locally, they run against `localhost:3001` (or your dev server port).

---

## 2. Installation

### Step 1: Install Cypress as a dev dependency

```bash
npm install --save-dev cypress
```

### Step 2: Add npm scripts to `package.json`

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run"
  }
}
```

| Script      | Purpose                                            |
| ----------- | -------------------------------------------------- |
| `cy:open`   | Opens the interactive Cypress Test Runner (GUI)    |
| `cy:run`    | Runs all tests headlessly in the terminal (for CI) |

### Step 3: First run to scaffold the directory

```bash
npx cypress open
```

This creates the `cypress/` directory with scaffolded examples. **Delete the example specs** — we'll write our own.

> [!CAUTION]
> **Do NOT use `npm ci` in CI if your project has sub-dependency resolution differences across environments** (e.g., zod v3/v4 coexistence). Use `npm install` instead. `npm ci` strictly follows `package-lock.json` and can fail when peer dependency resolutions differ between OS environments.

---

## 3. Project Structure

```
your-project/
├── cypress/
│   ├── e2e/                        # All test spec files
│   │   ├── landing.cy.ts           # Public page tests
│   │   ├── dashboard.cy.ts         # Authenticated page tests
│   │   ├── profile-functional.cy.ts# Form interaction tests
│   │   ├── job-lifecycle.cy.ts     # Full workflow E2E test
│   │   └── ...
│   ├── support/
│   │   └── e2e.ts                  # Global hooks, custom commands, type declarations
│   ├── screenshots/                # Auto-generated on test failure (gitignored)
│   ├── videos/                     # Auto-generated when video:true (gitignored)
│   └── tsconfig.json               # Cypress-specific TypeScript config
├── cypress.config.ts               # Cypress configuration (at project root)
├── .gitignore                      # Must include cypress/screenshots/ and cypress/videos/
└── package.json
```

> [!IMPORTANT]
> **Add to `.gitignore`:**
> ```gitignore
> # ---------- Cypress ----------
> cypress/screenshots/
> cypress/videos/
> ```

---

## 4. `cypress.config.ts` — The Configuration File

This file lives at the **project root**. Here is the production-tested template:

```typescript
import { defineConfig } from "cypress";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// Manual .env loader
// Cypress does NOT auto-load .env files. We must do it ourselves.
// This runs in Node.js context (not the browser).
// ============================================================
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      if (line.trim().startsWith("#") || !line.includes("=")) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        // Strip wrapping quotes
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    });
  }
}

loadEnv();

export default defineConfig({
  e2e: {
    // The default URL for cy.visit() and cy.request()
    baseUrl: "http://localhost:3001",

    // Path to the support file loaded before every spec
    supportFile: "cypress/support/e2e.ts",

    // Glob pattern for test spec files
    specPattern: "cypress/e2e/**/*.cy.ts",

    // Browser viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Recording
    video: false,                    // Set true to record videos
    screenshotOnRunFailure: true,    // Always screenshot on failure

    // Timeouts — CRITICAL for slow CI environments
    defaultCommandTimeout: 30000,    // 30s for DOM assertions
    requestTimeout: 30000,           // 30s for cy.request()
    responseTimeout: 30000,          // 30s for server responses

    // Environment variables accessible via Cypress.env()
    env: {
      // Map CYPRESS_* env vars to shorter keys for use in tests
      TEST_CLIENT_PRIVATE_KEY:
        process.env.CYPRESS_TEST_CLIENT_PRIVATE_KEY ?? "",
      TEST_WORKER_PRIVATE_KEY:
        process.env.CYPRESS_TEST_WORKER_PRIVATE_KEY ?? "",
      VERCEL_AUTOMATION_BYPASS_SECRET:
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    },

    // Node.js tasks (run server-side code from tests)
    setupNodeEvents(on) {
      on("task", {
        // Example: cryptographic signing in Node.js
        async signMessage({ privateKey, message }: {
          privateKey: string;
          message: string;
        }) {
          const { privateKeyToAccount } = await import("viem/accounts");
          const account = privateKeyToAccount(privateKey as `0x${string}`);
          return account.signMessage({ message });
        },
        async getWalletAddress({ privateKey }: { privateKey: string }) {
          const { privateKeyToAccount } = await import("viem/accounts");
          const account = privateKeyToAccount(privateKey as `0x${string}`);
          return account.address;
        },
      });
    },
  },
});
```

### Critical Configuration Notes

| Setting                    | Recommended Value | Why                                                                                                  |
| -------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `defaultCommandTimeout`    | `30000` (30s)     | Vercel cold starts and SSR hydration can be very slow in CI. The default 4s **will** cause failures.  |
| `requestTimeout`           | `30000` (30s)     | API calls to Supabase/external services need headroom.                                               |
| `responseTimeout`          | `30000` (30s)     | Matching the request timeout for consistency.                                                         |
| `video`                    | `false`           | Videos are large; enable only when debugging flaky tests.                                            |
| `screenshotOnRunFailure`   | `true`            | Always keep this on — screenshots are your best CI debugging tool.                                   |
| `baseUrl`                  | `http://localhost:3001` | Overridden by `CYPRESS_baseUrl` env var in CI.                                                 |

> [!WARNING]
> **The #1 cause of Cypress CI failures is timeout.** The default `defaultCommandTimeout` is only **4 seconds**. Any server-rendered page or API call that takes longer will cause a cryptic `Timed out retrying` error. **Always set it to at least 15000ms for CI, 30000ms recommended.**

---

## 5. TypeScript Configuration

### `cypress/tsconfig.json` (Separate from root tsconfig!)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["es2017", "dom"],
    "types": ["cypress"],
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["**/*.ts"]
}
```

> [!IMPORTANT]
> **Cypress needs its own `tsconfig.json` inside `cypress/`.** If you try to use the root `tsconfig.json`, you will get type conflicts between Cypress's global types and React/Next.js types. The `"types": ["cypress"]` line ensures only Cypress types are loaded, not `@types/react` etc.

### Root `tsconfig.json` — No changes needed

Cypress's `tsconfig.json` is self-contained. The root `tsconfig.json` does not need to reference or exclude the Cypress directory, because `cypress/tsconfig.json` takes precedence when Cypress runs.

---

## 6. Support File (`cypress/support/e2e.ts`)

This file runs **before every test spec**. Use it for:
- Custom commands (e.g., `cy.loginAs()`)
- Global `beforeEach` hooks
- Global event handlers
- TypeScript type declarations for custom commands

### Template

```typescript
/// <reference types="cypress" />

// ============================================================
// Type declarations for custom commands
// ============================================================
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Authenticate as a test account via SIWE flow.
       * Sets the session cookie automatically.
       */
      loginAs(role: "client" | "worker"): Chainable<void>;
    }
  }
}

// ============================================================
// Custom Command: loginAs
// Performs the SIWE (Sign-In With Ethereum) authentication flow
// ============================================================
Cypress.Commands.add("loginAs", (role: "client" | "worker") => {
  // Store the active role for use in window:before:load
  Cypress.env("CYPRESS_ACTIVE_ROLE", role);

  const privateKey =
    role === "client"
      ? Cypress.env("TEST_CLIENT_PRIVATE_KEY")
      : Cypress.env("TEST_WORKER_PRIVATE_KEY");

  if (!privateKey) {
    throw new Error(
      `Missing CYPRESS_TEST_${role.toUpperCase()}_PRIVATE_KEY env variable.`
    );
  }

  const chainId = 5042002; // Your chain ID

  // 1. Derive wallet address (runs in Node.js via cy.task)
  cy.task("getWalletAddress", { privateKey }, { log: false }).then(
    (address) => {
      const walletAddress = address as string;

      // 2. Request nonce from server
      cy.request({
        method: "POST",
        url: "/api/wallet/nonce",
        body: { address: walletAddress, chainId },
        timeout: 60000,
      }).then((nonceRes) => {
        expect(nonceRes.status).to.eq(200);

        // Validate response body
        if (!nonceRes.body?.message) {
          throw new Error(
            "Failed to retrieve SIWE nonce. " +
            "If testing against Vercel Preview, ensure VERCEL_AUTOMATION_BYPASS_SECRET is set."
          );
        }

        const { message, nonce } = nonceRes.body;

        // 3. Sign the SIWE message (runs in Node.js via cy.task)
        cy.task("signMessage", { privateKey, message }, { log: false }).then(
          (signature) => {
            // 4. Verify the signature → server sets session cookie
            cy.request({
              method: "POST",
              url: "/api/wallet/verify",
              body: {
                address: walletAddress,
                chainId,
                nonce,
                message,
                signature: signature as string,
                timezone: "Asia/Jakarta",
              },
              timeout: 60000,
            }).then((verifyRes) => {
              expect(verifyRes.status).to.eq(200);
              expect(verifyRes.body.profile).to.have.property("id");
            });
          }
        );
      });
    }
  );
});

// ============================================================
// Global beforeEach: Vercel Authentication Bypass
// ============================================================
beforeEach(() => {
  const bypassSecret = Cypress.env("VERCEL_AUTOMATION_BYPASS_SECRET");
  const baseUrl = Cypress.config("baseUrl") || "";

  // Warn if bypass secret is missing when targeting Vercel
  if (!bypassSecret && baseUrl.includes("vercel.app")) {
    cy.log(
      "WARNING: VERCEL_AUTOMATION_BYPASS_SECRET is not set. " +
      "Requests to Vercel preview will fail with 401."
    );
  }

  // Set the bypass cookie for Vercel Authentication
  if (bypassSecret) {
    cy.request({
      url: "/",
      headers: {
        "x-vercel-protection-bypass": bypassSecret,
        "x-vercel-set-bypass-cookie": "true",
      },
      failOnStatusCode: false,
    });
  }
});

// ============================================================
// Global: Inject localStorage before page loads
// ============================================================
Cypress.on("window:before:load", (win) => {
  // Skip onboarding tours, welcome modals, etc.
  win.localStorage.setItem("tour_done", "1");

  // Pass data to the app via localStorage if needed
  const activeRole = Cypress.env("CYPRESS_ACTIVE_ROLE");
  if (activeRole) {
    const privateKey =
      activeRole === "client"
        ? Cypress.env("TEST_CLIENT_PRIVATE_KEY")
        : Cypress.env("TEST_WORKER_PRIVATE_KEY");
    if (privateKey) {
      win.localStorage.setItem("CYPRESS_ACTIVE_PRIVATE_KEY", privateKey);
    }
  }
});

// ============================================================
// Global: Suppress uncaught exceptions
// ============================================================
Cypress.on("uncaught:exception", (err, runnable) => {
  // Third-party iframes (Privy, WalletConnect) throw errors
  // that are irrelevant to our tests. Return false to suppress.
  return false;
});

export {};
```

> [!CAUTION]
> **The `export {}` at the end is mandatory.** Without it, TypeScript treats the file as a script (not a module), and the `declare global` block will cause duplicate declaration errors.

---

## 7. Writing Test Specs

### File naming convention

```
cypress/e2e/<feature-name>.cy.ts
```

### Pattern 1: Public Page (no auth required)

```typescript
describe("Landing Page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should display hero title", () => {
    cy.get(".hero-title").should("be.visible");
    cy.get(".hero-title").should("contain.text", "Welcome");
  });

  it("should navigate to /jobs when CTA clicked", () => {
    cy.get('a[href="/jobs"]').first().click();
    cy.url().should("include", "/jobs");
  });
});
```

### Pattern 2: Authenticated Page

```typescript
describe("Dashboard Page", () => {
  beforeEach(() => {
    cy.loginAs("client");                                // Custom command
    cy.visit("/dashboard", { failOnStatusCode: false }); // failOnStatusCode: false for auth redirects
    cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");
  });

  it("renders dashboard content", () => {
    cy.get("h1").should("contain.text", "Welcome");
    cy.contains("My jobs").should("exist");
  });
});
```

### Pattern 3: Form Interaction

```typescript
it("fills and saves profile", () => {
  // Target fields by their label text, not brittle CSS selectors
  cy.get(".field")
    .contains("Display name")
    .parent()
    .find("input")
    .clear()
    .type("Test User");

  cy.get(".field")
    .contains("Role")
    .parent()
    .find("select")
    .select("client");

  cy.get(".field")
    .contains("Bio")
    .parent()
    .find("textarea")
    .clear()
    .type("E2E test account.");

  cy.get('button[type="submit"]').click();
  cy.contains("Profile updated", { timeout: 15000 }).should("be.visible");
});
```

### Pattern 4: Full Lifecycle / Workflow Test

```typescript
describe("Job Lifecycle", () => {
  const runId = Date.now().toString(36); // Unique per run

  it("should complete the full job flow", () => {
    // Step 1: Client creates a job
    cy.loginAs("client");
    cy.visit("/jobs/new", { failOnStatusCode: false });
    // ... fill form, submit ...
    cy.url({ timeout: 20000 }).should("match", /\/jobs\/[a-f0-9-]+$/);

    cy.url().then((url) => {
      const jobId = url.split("/").pop();

      // Step 2: Worker applies
      cy.loginAs("worker");
      cy.visit(`/jobs/${jobId}`, { failOnStatusCode: false });
      // ... apply ...

      // Step 3: Client accepts
      cy.loginAs("client");
      cy.visit(`/jobs/${jobId}`, { failOnStatusCode: false });
      cy.contains("button", "Accept").click();
      cy.get(".status-badge").first().should("have.text", "Assigned");
    });
  });
});
```

### Pattern 5: Responsive Testing

```typescript
describe("Responsive - Mobile", () => {
  beforeEach(() => {
    cy.viewport(375, 667); // iPhone SE
  });

  it("should still show brand", () => {
    cy.visit("/");
    cy.get(".brand").should("be.visible");
  });
});

describe("Responsive - Tablet", () => {
  beforeEach(() => {
    cy.viewport(768, 1024); // iPad
  });

  it("should still show all sections", () => {
    cy.visit("/");
    cy.get(".hero").should("exist");
    cy.get(".footer").should("exist");
  });
});
```

---

## 8. Custom Commands

### Where to define them

All custom commands go in `cypress/support/e2e.ts`.

### Declaring TypeScript types

```typescript
declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: "client" | "worker"): Chainable<void>;
      // Add more custom commands here
    }
  }
}
```

### Implementing the command

```typescript
Cypress.Commands.add("loginAs", (role: "client" | "worker") => {
  // ... implementation ...
});
```

> [!NOTE]
> **`cy.task()` runs in Node.js**, not in the browser. Use it for operations that need server-side capabilities: cryptographic signing, database queries, file system operations, etc. Define tasks in `cypress.config.ts` under `setupNodeEvents`.

---

## 9. Environment Variables

### How Cypress resolves env vars

Cypress has a **specific prefix convention**:

| Source                  | Example                                    | Access in test                     |
| ----------------------- | ------------------------------------------ | ---------------------------------- |
| `CYPRESS_*` env var     | `CYPRESS_baseUrl=http://...`               | `Cypress.config("baseUrl")`        |
| `CYPRESS_*` env var     | `CYPRESS_TEST_CLIENT_PRIVATE_KEY=0x...`    | `Cypress.env("TEST_CLIENT_PRIVATE_KEY")` |
| `cypress.config.ts` env | `env: { MY_VAR: "value" }`                | `Cypress.env("MY_VAR")`           |
| CLI flag                | `--env MY_VAR=value`                       | `Cypress.env("MY_VAR")`           |

> [!IMPORTANT]
> **The `CYPRESS_` prefix is automatically stripped.** So `CYPRESS_TEST_CLIENT_PRIVATE_KEY` becomes `TEST_CLIENT_PRIVATE_KEY` in `Cypress.env()`. But `CYPRESS_baseUrl` is a **special case** — it directly sets `Cypress.config("baseUrl")`.

### `.env` file (local development)

```env
# Cypress test wallets
CYPRESS_TEST_CLIENT_PRIVATE_KEY=0x_your_client_private_key_here
CYPRESS_TEST_WORKER_PRIVATE_KEY=0x_your_worker_private_key_here

# Vercel automation bypass (get from Vercel Project Settings)
VERCEL_AUTOMATION_BYPASS_SECRET=your_bypass_secret_here
```

> [!CAUTION]
> **Cypress does NOT auto-load `.env` files.** Unlike Next.js, Cypress has no built-in dotenv support. You must either:
> 1. Use the manual `loadEnv()` function shown in Section 4 (recommended), OR
> 2. Install `dotenv` and call it in `cypress.config.ts`, OR
> 3. Prefix every command: `dotenv -- npx cypress run`
>
> **If you skip this, all `Cypress.env()` calls will return empty strings, and your tests will silently fail or throw confusing errors.**

---

## 10. CI/CD with GitHub Actions

### Complete workflow file: `.github/workflows/cypress.yml`

```yaml
# ============================================================
# Cypress E2E Tests — GitHub Actions
# Runs on PR to main branch. Vercel deploy must pass first.
#
# Required GitHub Secrets (Settings → Secrets → Actions):
#   NEXT_PUBLIC_PRIVY_APP_ID
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   CYPRESS_TEST_CLIENT_PRIVATE_KEY
#   CYPRESS_TEST_WORKER_PRIVATE_KEY
#   VERCEL_AUTOMATION_BYPASS_SECRET
# ============================================================

name: Cypress E2E Tests

on:
  pull_request:
    branches: [main]

jobs:
  cypress:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: Production  # Use GitHub Environment for secret scoping

    # ---- Shared env vars for all steps ----
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      NEXT_PUBLIC_PRIVY_APP_ID: ${{ secrets.NEXT_PUBLIC_PRIVY_APP_ID }}
      CYPRESS_TEST_CLIENT_PRIVATE_KEY: ${{ secrets.CYPRESS_TEST_CLIENT_PRIVATE_KEY }}
      CYPRESS_TEST_WORKER_PRIVATE_KEY: ${{ secrets.CYPRESS_TEST_WORKER_PRIVATE_KEY }}
      VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
      CYPRESS_baseUrl: http://localhost:3001  # Default, overridden below

    steps:
      # ---- Checkout ----
      - name: Checkout repository
        uses: actions/checkout@v4

      # ---- Node.js Setup ----
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      # ---- Install Dependencies ----
      - name: Install dependencies
        run: npm install

      # ---- Wait for Vercel Deployment ----
      - name: Wait for Vercel Preview
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.3
        id: waitForVercel
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 450  # 7.5 minutes
          vercel_protection_bypass_header: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}

      # ---- Run Cypress Tests ----
      - name: Cypress run
        uses: cypress-io/github-action@v6
        with:
          browser: chrome
        env:
          CYPRESS_baseUrl: ${{ steps.waitForVercel.outputs.url }}

      # ---- Upload Screenshots on Failure ----
      - name: Upload Cypress screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
          if-no-files-found: ignore
          retention-days: 7

      # ---- Upload Videos (if enabled) ----
      - name: Upload Cypress videos
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-videos
          path: cypress/videos
          if-no-files-found: ignore
          retention-days: 7
```

### Key Actions Used

| Action                                        | Purpose                                     |
| --------------------------------------------- | ------------------------------------------- |
| `actions/checkout@v4`                         | Clone the repo                              |
| `actions/setup-node@v4`                       | Install Node.js with npm cache              |
| `patrickedqvist/wait-for-vercel-preview@v1.3.3` | Wait for Vercel to finish deploying       |
| `cypress-io/github-action@v6`                 | Install Cypress deps + run tests            |
| `actions/upload-artifact@v4`                   | Save screenshots/videos for debugging       |

> [!IMPORTANT]
> **The `cypress-io/github-action@v6` does NOT require a separate `npm install` for Cypress** — it handles Cypress binary installation internally. However, you still need `npm install` for your project dependencies, because Cypress imports from your project (e.g., `viem/accounts` in tasks).

---

## 11. Vercel Preview Deployment Testing

This is the **trickiest part** of the setup. Here's what you need to know:

### The Problem

Vercel Preview Deployments have **Vercel Authentication** enabled by default. This means:
- Any request without a valid session gets a `401 Unauthorized` or is redirected to a login page
- Cypress cannot authenticate with Vercel's own auth system
- Your API calls from Cypress will fail silently (returning HTML login pages instead of JSON)

### The Solution: Automation Bypass Secret

1. **In Vercel Dashboard**: Go to `Project Settings → Deployment Protection → Protection Bypass for Automation`
2. **Generate** a bypass secret
3. **Save** the secret as `VERCEL_AUTOMATION_BYPASS_SECRET` in:
   - Your `.env` file (local)
   - GitHub Repository Secrets (CI)

4. **In your support file**, set the bypass cookie before every test:

```typescript
beforeEach(() => {
  const bypassSecret = Cypress.env("VERCEL_AUTOMATION_BYPASS_SECRET");
  if (bypassSecret) {
    cy.request({
      url: "/",
      headers: {
        "x-vercel-protection-bypass": bypassSecret,
        "x-vercel-set-bypass-cookie": "true",
      },
      failOnStatusCode: false,
    });
  }
});
```

### How the CI Flow Works

```
PR opened → Vercel deploys preview → GitHub Actions detects deployment
→ Cypress runs against preview URL with bypass cookie → Tests pass/fail
→ PR is blocked/unblocked based on result
```

> [!WARNING]
> **If you see `Failed to retrieve SIWE nonce` or your API calls return HTML instead of JSON**, the bypass secret is either missing or incorrect. The Vercel auth page is being served instead of your API response.

### Using GitHub Environments for Secrets

If your secrets are stored in a **GitHub Environment** (e.g., "Production"), you must reference it in the workflow:

```yaml
jobs:
  cypress:
    runs-on: ubuntu-latest
    environment: Production  # ← This line is critical
```

Without this, the job cannot access environment-scoped secrets, and **all `${{ secrets.* }}` values will be empty strings** — your tests will fail with unhelpful errors.

---

## 12. Common Pitfalls & Solutions

### Pitfall 1: `npm ci` fails with peer dependency errors

**Symptom**: CI fails at `npm ci` with errors like:
```
npm ERR! peer dep missing: zod@^3.0.0, required by @some-package
```

**Cause**: `npm ci` enforces strict `package-lock.json` resolution. If sub-dependencies resolve differently across OS/Node versions, it fails.

**Solution**: Use `npm install` instead of `npm ci`:
```yaml
- name: Install dependencies
  run: npm install
```

---

### Pitfall 2: Tests pass locally but fail in CI with timeouts

**Symptom**: `Timed out retrying after 4000ms: Expected to find element: '.my-element'`

**Cause**: Default `defaultCommandTimeout` is 4 seconds. Vercel cold starts take 5-15 seconds.

**Solution**: Set generous timeouts in `cypress.config.ts`:
```typescript
defaultCommandTimeout: 30000,
requestTimeout: 30000,
responseTimeout: 30000,
```

---

### Pitfall 3: `CYPRESS_baseUrl` not working in CI

**Symptom**: Cypress still uses `http://localhost:3001` in CI instead of the Vercel URL.

**Cause**: The `CYPRESS_baseUrl` env var must be set at the **step level**, not just the job level, to override with the dynamic Vercel URL.

**Solution**:
```yaml
- name: Cypress run
  uses: cypress-io/github-action@v6
  env:
    CYPRESS_baseUrl: ${{ steps.waitForVercel.outputs.url }}
```

---

### Pitfall 4: GitHub Secrets are empty in the workflow

**Symptom**: All API calls fail. `Cypress.env("TEST_CLIENT_PRIVATE_KEY")` returns empty string.

**Cause**: Secrets are stored in a GitHub Environment but the workflow doesn't reference it.

**Solution**: Add `environment: YourEnvironmentName` to the job:
```yaml
jobs:
  cypress:
    runs-on: ubuntu-latest
    environment: Production  # ← Must match your GitHub Environment name
```

---

### Pitfall 5: Uncaught exceptions from third-party iframes

**Symptom**: Tests fail with `The following error originated from your application code, not from Cypress` — pointing to Privy, WalletConnect, or other third-party code.

**Cause**: Third-party SDKs loaded in iframes throw errors that Cypress catches.

**Solution**: Suppress in the support file:
```typescript
Cypress.on("uncaught:exception", (err, runnable) => {
  return false; // Prevents Cypress from failing the test
});
```

---

### Pitfall 6: `cy.task()` fails with `task not found`

**Symptom**: `CypressError: cy.task('signMessage') failed with the following error: The task 'signMessage' was not handled`

**Cause**: Tasks are defined in `cypress.config.ts` → `setupNodeEvents`, but the config wasn't loaded properly.

**Solution**: Ensure tasks are defined correctly:
```typescript
setupNodeEvents(on) {
  on("task", {
    async signMessage({ privateKey, message }) {
      // Must return a value or null — never undefined
      const { privateKeyToAccount } = await import("viem/accounts");
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      return account.signMessage({ message });
    },
  });
},
```

> [!NOTE]
> Tasks must **always return a value or `null`**. Returning `undefined` causes Cypress to think the task was not handled. If your task has no meaningful return value, explicitly `return null`.

---

### Pitfall 7: TypeScript type conflicts

**Symptom**: `Cannot find name 'cy'` or `Property 'loginAs' does not exist on type 'Chainable'`

**Cause**: Missing or misconfigured `cypress/tsconfig.json`.

**Solution**: Ensure `cypress/tsconfig.json` has `"types": ["cypress"]` and the support file has `/// <reference types="cypress" />` at the top.

---

### Pitfall 8: `failOnStatusCode: false` — when to use

**Symptom**: Test fails immediately on `cy.visit()` because the page returns a non-2xx status code (e.g., redirect to login).

**Cause**: By default, `cy.visit()` fails if the page returns a non-2xx response.

**Solution**: For authenticated pages that may redirect:
```typescript
cy.visit("/dashboard", { failOnStatusCode: false });
```

---

### Pitfall 9: Flaky tests due to hydration timing

**Symptom**: Test sometimes passes, sometimes fails. Element exists in DOM but interactions fail.

**Cause**: Next.js SSR hydration hasn't completed. The HTML is rendered but React hasn't attached event handlers yet.

**Solution**: Wait for a meaningful application state before interacting:
```typescript
// Instead of just checking the element exists:
cy.get("button").click(); // ❌ Might click before React hydrates

// Wait for a sign that the app is fully interactive:
cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");
cy.get("form.panel", { timeout: 20000 }).should("exist");
cy.get('button[type="submit"]').click(); // ✅ App is hydrated
```

---

## 13. Troubleshooting Checklist

When Cypress tests fail, check these items in order:

```
□ 1. Are all GitHub Secrets populated?
     → Settings → Secrets and variables → Actions
     → Check if using GitHub Environments (needs `environment:` in workflow)

□ 2. Is the Vercel deployment accessible?
     → Check Vercel dashboard for deployment status
     → Try opening the preview URL manually

□ 3. Is VERCEL_AUTOMATION_BYPASS_SECRET set?
     → Vercel Project Settings → Deployment Protection
     → Must be set in both Vercel and GitHub Secrets

□ 4. Are timeouts sufficient?
     → defaultCommandTimeout should be ≥ 15000ms
     → Check for cold start delays on first request

□ 5. Is the support file loading?
     → cypress.config.ts → supportFile path must be correct
     → File must export {} at the end

□ 6. Are env vars reaching Cypress?
     → Add cy.log(Cypress.env("MY_VAR")) to debug
     → Remember: CYPRESS_ prefix is stripped

□ 7. Is the .env file being loaded?
     → Check that loadEnv() is called in cypress.config.ts
     → Or install dotenv and configure it

□ 8. Are there TypeScript errors?
     → Check cypress/tsconfig.json exists and is valid
     → Run: npx tsc --noEmit -p cypress/tsconfig.json

□ 9. Is the correct baseUrl being used?
     → Local: http://localhost:3001 (from config)
     → CI: Vercel URL (from CYPRESS_baseUrl env var)

□ 10. Check CI artifacts for screenshots
      → Download from GitHub Actions → Artifacts tab
      → Screenshots show the exact state when the test failed
```

---

## 14. Checklist — Copy-Paste Ready

Use this checklist when adding Cypress to a new project:

### Initial Setup

```
□ npm install --save-dev cypress
□ Add "cy:open" and "cy:run" scripts to package.json
□ Run npx cypress open (scaffolds directory)
□ Delete example specs from cypress/e2e/
□ Create cypress/tsconfig.json with "types": ["cypress"]
□ Create cypress/support/e2e.ts with export {}
□ Create cypress.config.ts at project root
□ Add loadEnv() function if using .env files
□ Add cypress/screenshots/ and cypress/videos/ to .gitignore
```

### Configuration

```
□ Set baseUrl to your local dev server URL
□ Set defaultCommandTimeout to at least 15000 (30000 recommended)
□ Set requestTimeout and responseTimeout to match
□ Configure supportFile path
□ Configure specPattern
□ Set video: false (enable only when needed)
□ Set screenshotOnRunFailure: true
□ Add env vars mapping in cypress.config.ts
□ Add setupNodeEvents with cy.task() definitions if needed
```

### Support File

```
□ Add /// <reference types="cypress" /> at top
□ Declare custom command types in declare global block
□ Implement custom commands with Cypress.Commands.add()
□ Add Vercel bypass in beforeEach (if using Vercel)
□ Add Cypress.on("uncaught:exception") handler
□ Add window:before:load handler for localStorage setup
□ End file with export {}
```

### CI/CD

```
□ Create .github/workflows/cypress.yml
□ Add all required GitHub Secrets
□ Add environment: name if using GitHub Environments
□ Use npm install (not npm ci) if peer deps are fragile
□ Add wait-for-vercel-preview step
□ Override CYPRESS_baseUrl with Vercel preview URL
□ Add screenshot upload step with if: failure()
□ Add video upload step with if: failure()
□ Set timeout-minutes: 15 on the job
```

### Vercel-Specific

```
□ Generate Automation Bypass Secret in Vercel Dashboard
□ Save as VERCEL_AUTOMATION_BYPASS_SECRET in GitHub Secrets
□ Add bypass cookie logic in support file's beforeEach
□ Add vercel_protection_bypass_header to wait-for-vercel step
```

### Writing Tests

```
□ Use describe/it blocks with clear descriptions
□ Use cy.visit() with failOnStatusCode: false for auth pages
□ Wait for hydration before interacting (timeout on meaningful elements)
□ Use cy.contains() for text-based element selection
□ Use .field + label pattern for form fields (not brittle selectors)
□ Use unique runId for test data isolation
□ Use cy.url().then() to capture dynamic IDs
□ Add responsive tests with cy.viewport()
```

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────────────┐
│                  CYPRESS QUICK REFERENCE                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  LOCAL DEV                                               │
│  ─────────                                               │
│  Start dev server:   npm run dev                         │
│  Open Cypress GUI:   npm run cy:open                     │
│  Run headless:       npm run cy:run                      │
│  Run single spec:    npx cypress run --spec "cypress/    │
│                      e2e/landing.cy.ts"                  │
│                                                          │
│  KEY FILES                                               │
│  ─────────                                               │
│  Config:        cypress.config.ts                        │
│  Support:       cypress/support/e2e.ts                   │
│  Tests:         cypress/e2e/*.cy.ts                      │
│  TS Config:     cypress/tsconfig.json                    │
│  CI Workflow:   .github/workflows/cypress.yml            │
│                                                          │
│  ENVIRONMENT VARIABLES                                   │
│  ─────────────────────                                   │
│  CYPRESS_baseUrl                → Cypress.config()       │
│  CYPRESS_MY_VAR                 → Cypress.env("MY_VAR")  │
│  In cypress.config.ts env: {}   → Cypress.env("KEY")     │
│                                                          │
│  COMMON COMMANDS                                         │
│  ───────────────                                         │
│  cy.visit("/path")              Navigate to page         │
│  cy.get(".selector")            Find by CSS              │
│  cy.contains("text")            Find by text content     │
│  cy.request({...})              Make HTTP request         │
│  cy.task("name", data)          Run Node.js code         │
│  cy.intercept("GET", "/api/*")  Stub/spy network         │
│                                                          │
│  ASSERTIONS                                              │
│  ──────────                                              │
│  .should("be.visible")                                   │
│  .should("contain.text", "x")                            │
│  .should("have.length", 3)                               │
│  .should("have.attr", "href", "/path")                   │
│  .should("exist") / .should("not.exist")                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

> **Document maintained by**: WorkNet Engineering Team
> **Version**: 1.0.0
> **License**: Internal Use
