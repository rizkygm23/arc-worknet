/**
 * Job Lifecycle E2E Test — Human-to-Human (Complete Onchain Flow)
 *
 * Tests the complete job flow onchain:
 *   1. Client sets up profile
 *   2. Client creates a job (0.001 USDC budget)
 *   3. Worker sets up profile
 *   4. Worker applies to the job
 *   5. Client accepts the application -> Status: Assigned
 *   6. Client starts the job onchain -> Status: Started (onchain_created)
 *   7. Client sets the budget onchain -> Status: Budget (budget_set)
 *   8. Client funds the escrow -> Status: Funded
 *   9. Worker submits deliverable -> Status: Submitted
 *   10. Client completes the job & releases payment -> Status: Completed
 */
describe("Job Lifecycle — Human to Human", () => {
  // Unique suffix to avoid collisions across runs
  const runId = Date.now().toString(36);
  const jobTitle = `E2E Test Job ${runId}`;

  it("should execute the complete job lifecycle onchain", () => {
    // ─── Step 1: Client profile setup ─────────────────────────────────
    cy.loginAs("client");
    cy.visit("/settings/profile", { failOnStatusCode: false });
    // Wait for mock wallet to connect
    cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");

    // Wait for profile form to render
    cy.get("form.panel", { timeout: 20000 }).should("exist");

    // Set display name
    cy.get(".field")
      .contains("Display name")
      .parent()
      .find("input")
      .clear()
      .type(`Client ${runId}`);

    // Set role to Client
    cy.get(".field")
      .contains("Role")
      .parent()
      .find("select")
      .select("client");

    // Set bio
    cy.get(".field")
      .contains("Bio")
      .parent()
      .find("textarea")
      .clear()
      .type("E2E test client account.");

    // Save profile
    cy.get('button[type="submit"]').click();
    cy.contains("Profile updated", { timeout: 15000 }).should("be.visible");

    // ─── Step 2: Client creates a new job ─────────────────────────────
    cy.visit("/jobs/new", { failOnStatusCode: false });
    cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");

    // Wait for form to render
    cy.get("form.panel", { timeout: 20000 }).should("exist");

    // Fill title
    cy.get(".field")
      .contains("Title")
      .parent()
      .find("input")
      .clear()
      .type(jobTitle);

    // Fill brief
    cy.get(".field")
      .contains("Brief")
      .parent()
      .find("textarea")
      .clear()
      .type("Build a deterministic event indexer for Arc Testnet smart contracts. Must handle reorgs gracefully.");

    // Fill acceptance criteria
    cy.get(".field")
      .contains("Acceptance criteria")
      .parent()
      .find("textarea")
      .clear()
      .type("1. Indexer processes events within 2 blocks.\n2. Reorg handling tested.\n3. Unit tests pass.");

    // Deliverable format
    cy.get(".field")
      .contains("Deliverable format")
      .parent()
      .find("input")
      .clear()
      .type("Pull request URL");

    // Category
    cy.get(".field")
      .contains("Category")
      .parent()
      .find("input")
      .clear()
      .type("Engineering");

    // Budget (USDC)
    cy.get(".field")
      .contains("Budget")
      .parent()
      .find('input[type="number"]')
      .clear()
      .type("0.001");

    // Provider type = Human
    cy.get(".field")
      .contains("Provider type")
      .parent()
      .find("select")
      .select("human");

    // Tags
    cy.get(".field")
      .contains("Tags")
      .parent()
      .find("input")
      .clear()
      .type("Arc, Indexer, E2E");

    // Submit job
    cy.get('button[type="submit"]').click();

    // Should redirect to /jobs/{id}
    cy.url({ timeout: 20000 }).should("match", /\/jobs\/[a-f0-9-]+$/);

    // Capture the job ID
    cy.url().then((url) => {
      const segments = url.split("/");
      const createdJobId = segments[segments.length - 1];
      expect(createdJobId).to.match(/^[a-f0-9-]+$/);

      // Verify the job detail page shows our title
      cy.contains(jobTitle).should("be.visible");

      // Verify status badge shows "Open"
      cy.get(".status-badge").first().should("have.text", "Open");

      // ─── Step 3: Worker sets up profile ─────────────────────────────
      cy.loginAs("worker");
      cy.visit("/settings/profile", { failOnStatusCode: false });
      cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");

      // Wait for form
      cy.get("form.panel", { timeout: 20000 }).should("exist");

      // Set display name
      cy.get(".field")
        .contains("Display name")
        .parent()
        .find("input")
        .clear()
        .type(`Worker ${runId}`);

      // Set role to Worker
      cy.get(".field")
        .contains("Role")
        .parent()
        .find("select")
        .select("worker");

      // Set availability
      cy.get(".field")
        .contains("Availability")
        .parent()
        .find("select")
        .select("open");

      // Set bio
      cy.get(".field")
        .contains("Bio")
        .parent()
        .find("textarea")
        .clear()
        .type("E2E test worker account. Skilled in Solidity and TypeScript.");

      // Save profile
      cy.get('button[type="submit"]').click();
      cy.contains("Profile updated", { timeout: 15000 }).should("be.visible");

      // ─── Step 4: Worker applies to the job ──────────────────────────
      cy.visit(`/jobs/${createdJobId}`, { failOnStatusCode: false });
      cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");

      // Verify the job title is displayed
      cy.contains(jobTitle, { timeout: 20000 }).should("be.visible");

      // Fill the pitch textarea
      cy.get("textarea")
        .filter(":visible")
        .first()
        .clear()
        .type("I have extensive experience building indexers for EVM chains. I can deliver this within the deadline with comprehensive tests.");

      // Click Apply button
      cy.contains("button", "Apply").click();

      // After applying, the application should be visible
      cy.contains("pending", { timeout: 15000 }).should("exist");

      // ─── Step 5: Client accepts the worker application ────────────
      cy.loginAs("client");
      cy.visit(`/jobs/${createdJobId}`, { failOnStatusCode: false });
      cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");

      // Wait for the page to load
      cy.contains(jobTitle, { timeout: 20000 }).should("be.visible");

      // The client should see the applicant card with an "Accept" button
      cy.contains("button", "Accept", { timeout: 15000 }).should("be.visible");

      // Accept the application
      cy.contains("button", "Accept").click();

      // After accepting, the job status should transition to "Assigned"
      cy.get(".status-badge", { timeout: 25000 }).first().should("have.text", "Assigned");

      // ─── Step 6: Client starts the onchain job ──────────────────────
      // Verify the button "Start job" is visible and click it
      cy.contains("button", "Start job", { timeout: 15000 }).click();

      // Verify status transitions to "Onchain created"
      cy.get(".status-badge", { timeout: 60000 }).first().should("have.text", "Onchain created");

      // ─── Step 7: Client sets budget onchain ─────────────────────────
      // Click "Set budget" button
      cy.contains("button", "Set budget", { timeout: 15000 }).click();

      // Verify status transitions to "Budget set"
      cy.get(".status-badge", { timeout: 60000 }).first().should("have.text", "Budget set");

      // ─── Step 8: Client funds the escrow ────────────────────────────
      // Click "Fund escrow" button
      cy.contains("button", "Fund escrow", { timeout: 15000 }).click();

      // Verify status transitions to "Funded"
      cy.get(".status-badge", { timeout: 60000 }).first().should("have.text", "Funded");

      // ─── Step 9: Worker submits deliverable ──────────────────────────
      cy.loginAs("worker");
      cy.visit(`/jobs/${createdJobId}`, { failOnStatusCode: false });
      cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");

      // Verify status is "Funded"
      cy.get(".status-badge", { timeout: 15000 }).first().should("have.text", "Funded");

      // Click "Submit" button in header
      cy.contains("a", "Submit").click();

      // Should navigate to submit page
      cy.url().should("include", "/submit");

      // Fill notes
      cy.get("textarea").clear().type("E2E deliverable indexer code is complete. Tested all scenarios.");

      // Fill external link
      cy.get('input[type="url"]').clear().type("https://github.com/arcworknet/e2e-indexer");

      // Submit
      cy.get('button[type="submit"]').click();

      // Should redirect back to job details and status becomes "Submitted"
      cy.url({ timeout: 25000 }).should("match", /\/jobs\/[a-f0-9-]+$/);
      cy.get(".status-badge", { timeout: 60000 }).first().should("have.text", "Submitted");

      // ─── Step 10: Client completes the job & releases payment ────────
      cy.loginAs("client");
      cy.visit(`/jobs/${createdJobId}`, { failOnStatusCode: false });
      cy.contains("button", "Connect", { timeout: 30000 }).should("not.exist");

      // Verify status is "Submitted"
      cy.get(".status-badge", { timeout: 15000 }).first().should("have.text", "Submitted");

      // Click "Review" button in header
      cy.contains("a", "Review").click();

      // Should navigate to review page
      cy.url().should("include", "/review");

      // Verify default rating is 5
      cy.get('input[type="number"]').should("have.value", "5");
      cy.get("textarea").clear().type("Acceptance criteria fully met. Reorg testing works beautifully.");

      // Click Approve & pay worker
      cy.contains("button", "Approve & pay worker").click();

      // Should redirect back to job details and status becomes "Completed"
      cy.url({ timeout: 25000 }).should("match", /\/jobs\/[a-f0-9-]+$/);
      cy.get(".status-badge", { timeout: 60000 }).first().should("have.text", "Completed");

      // Transactions panel should show Payment released
      cy.contains("Payment released", { timeout: 15000 }).should("exist");
    });
  });
});
