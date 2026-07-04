/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Authenticate as a test account by performing the full SIWE flow
       * (nonce → sign → verify) using the test wallet private key.
       * Sets the `arc_worknet_wallet_session` cookie automatically.
       */
      loginAs(role: "client" | "worker"): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginAs", (role: "client" | "worker") => {
  Cypress.env("CYPRESS_ACTIVE_ROLE", role);
  const privateKey =
    role === "client"
      ? Cypress.env("TEST_CLIENT_PRIVATE_KEY")
      : Cypress.env("TEST_WORKER_PRIVATE_KEY");

  if (!privateKey) {
    throw new Error(
      `Missing CYPRESS_TEST_${role.toUpperCase()}_PRIVATE_KEY env variable. ` +
        `Set it in .env or pass via CYPRESS_TEST_${role.toUpperCase()}_PRIVATE_KEY.`,
    );
  }

  const chainId = 5042002; // ARC_TESTNET_CHAIN_ID

  // 1. Derive wallet address from private key (runs in Node via task)
  cy.task("getWalletAddress", { privateKey }, { log: false }).then((address) => {
    const walletAddress = address as string;

    // 2. Request nonce from server
    cy.request({
      method: "POST",
      url: "/api/wallet/nonce",
      body: {
        address: walletAddress,
        chainId,
      },
      timeout: 60000,
    }).then((nonceRes) => {
      expect(nonceRes.status).to.eq(200);
      
      if (typeof nonceRes.body !== "object" || !nonceRes.body || !nonceRes.body.message) {
        throw new Error(
          "Failed to retrieve SIWE nonce. The Vercel preview deployment is protected by Vercel Authentication. " +
          "Please verify that you have generated an 'Automation Bypass Secret' in Vercel Project Settings " +
          "and saved it as 'VERCEL_AUTOMATION_BYPASS_SECRET' in your GitHub Repository Secrets."
        );
      }

      const { message, nonce } = nonceRes.body;

      // 3. Sign the SIWE message with private key (runs in Node via task)
      cy.task("signMessage", { privateKey, message }, { log: false }).then((signature) => {
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
          // Session cookie (arc_worknet_wallet_session) is automatically
          // set by cy.request and shared with subsequent cy.visit calls.
        });
      });
    });
  });
});

beforeEach(() => {
  const bypassSecret = Cypress.env("VERCEL_AUTOMATION_BYPASS_SECRET");
  const baseUrl = Cypress.config("baseUrl") || "";
  
  if (!bypassSecret && baseUrl.includes("vercel.app")) {
    cy.log("WARNING: VERCEL_AUTOMATION_BYPASS_SECRET is not set. Requests to Vercel preview deployments will likely fail with 401 Unauthorized.");
  }
  
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

Cypress.on("window:before:load", (win) => {
  win.localStorage.setItem("arcworknet_tour_done", "1");
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

Cypress.on("uncaught:exception", (err, runnable) => {
  // Prevents Cypress from failing the test on unhandled exceptions (e.g. from Privy iframes)
  return false;
});

export {};
