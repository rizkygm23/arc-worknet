describe("Profile Settings — Functional", () => {
  describe("Client profile setup", () => {
    beforeEach(() => {
      cy.loginAs("client");
      cy.visit("/settings/profile", { failOnStatusCode: false });
    });

    it("renders profile form with wallet address", () => {
      cy.get("h1").should("contain.text", "Your account");
      cy.get("form.panel").should("exist");
      // Wallet field should be filled (readonly) with the test wallet address
      cy.get('input[readonly]').should("exist");
    });

    it("fills and saves client profile", () => {
      // Fill display name
      cy.get(".field")
        .contains("Display name")
        .parent()
        .find("input")
        .clear()
        .type("Test Client E2E");

      // Fill handle
      cy.get(".field")
        .contains("Handle")
        .parent()
        .find("input")
        .clear()
        .type("test-client-e2e");

      // Select role = Client
      cy.get(".field")
        .contains("Role")
        .parent()
        .find("select")
        .select("client");

      // Fill bio
      cy.get(".field")
        .contains("Bio")
        .parent()
        .find("textarea")
        .clear()
        .type("Automated test client account for Cypress E2E testing.");

      // Fill country code
      cy.get(".field")
        .contains("Country code")
        .parent()
        .find("input")
        .clear()
        .type("ID");

      // Fill timezone
      cy.get(".field")
        .contains("Timezone")
        .parent()
        .find("input")
        .clear()
        .type("Asia/Jakarta");

      // Save
      cy.get('button[type="submit"]').click();

      // Verify success message
      cy.contains("Profile updated", { timeout: 10000 }).should("be.visible");
    });
  });

  describe("Worker profile setup", () => {
    beforeEach(() => {
      cy.loginAs("worker");
      cy.visit("/settings/profile", { failOnStatusCode: false });
    });

    it("fills and saves worker profile with skills", () => {
      // Fill display name
      cy.get(".field")
        .contains("Display name")
        .parent()
        .find("input")
        .clear()
        .type("Test Worker E2E");

      // Fill handle
      cy.get(".field")
        .contains("Handle")
        .parent()
        .find("input")
        .clear()
        .type("test-worker-e2e");

      // Select role = Worker
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

      // Fill bio
      cy.get(".field")
        .contains("Bio")
        .parent()
        .find("textarea")
        .clear()
        .type("Automated test worker account for Cypress E2E testing.");

      // Fill country code
      cy.get(".field")
        .contains("Country code")
        .parent()
        .find("input")
        .clear()
        .type("ID");

      // Fill timezone
      cy.get(".field")
        .contains("Timezone")
        .parent()
        .find("input")
        .clear()
        .type("Asia/Jakarta");

      // Add skills
      cy.get(".field")
        .contains("Skills")
        .parent()
        .find("input")
        .type("Solidity{enter}");

      cy.get(".field")
        .contains("Skills")
        .parent()
        .find("input")
        .type("TypeScript{enter}");

      // Verify skill badges appear
      cy.get(".badge").contains("Solidity").should("exist");
      cy.get(".badge").contains("TypeScript").should("exist");

      // Save
      cy.get('button[type="submit"]').click();

      // Verify success message
      cy.contains("Profile updated", { timeout: 10000 }).should("be.visible");
    });

    it("shows profile completeness bar", () => {
      cy.get(".completeness-bar").should("exist");
      cy.get(".completeness-percent").should("exist");
    });
  });
});
