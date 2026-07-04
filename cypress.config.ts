import { defineConfig } from "cypress";
import * as fs from "fs";
import * as path from "path";

// Manually load .env variables into process.env if they are not already set (e.g. on CI)
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      // Skip comments or empty lines
      if (line.trim().startsWith("#") || !line.includes("=")) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
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
    baseUrl: "http://localhost:3001",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.ts",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    env: {
      TEST_CLIENT_PRIVATE_KEY:
        process.env.CYPRESS_TEST_CLIENT_PRIVATE_KEY ?? "",
      TEST_WORKER_PRIVATE_KEY:
        process.env.CYPRESS_TEST_WORKER_PRIVATE_KEY ?? "",
    },
    setupNodeEvents(on) {
      on("task", {
        async signMessage({
          privateKey,
          message,
        }: {
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
