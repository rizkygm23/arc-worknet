describe("Landing Page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  describe("Navigation Bar", () => {
    it("should display brand name", () => {
      cy.get(".landing-brand").should("contain.text", "Arc WorkNet");
    });

    it("should have navigation links", () => {
      cy.get(".landing-nav-link").should("have.length", 3);
      cy.get('.landing-nav-link[href="#how"]').should("contain.text", "How it works");
      cy.get('.landing-nav-link[href="#clients"]').should("contain.text", "For clients");
      cy.get('.landing-nav-link[href="#workers"]').should("contain.text", "For workers");
    });

    it("should have Browse jobs button", () => {
      cy.get(".landing-nav-actions").find("a").should("contain.text", "Browse jobs");
    });

    it("should navigate to /jobs when Browse jobs clicked", () => {
      cy.get(".landing-nav-actions").find('a[href="/jobs"]').click();
      cy.url().should("include", "/jobs");
    });
  });

  describe("Hero Section", () => {
    it("should display hero title", () => {
      cy.get(".landing-hero-title").should("be.visible");
      cy.get(".landing-hero-title").should("contain.text", "Onchain escrow for");
      cy.get(".landing-hero-title").should("contain.text", "USDC");
    });

    it("should display hero subtitle", () => {
      cy.get(".landing-hero-sub").should("be.visible");
      cy.get(".landing-hero-sub").should(
        "contain.text",
        "A job marketplace where payment is locked onchain"
      );
    });

    it("should have Post a job button", () => {
      cy.get(".landing-cta-row").first().find("button").should("contain.text", "Post a job");
    });

    it("should have Browse open jobs link", () => {
      cy.get(".landing-cta-row").first().find('a[href="/jobs"]').should("contain.text", "Browse open jobs");
    });

    it("should display stats badges", () => {
      cy.get(".landing-stat").should("have.length", 4);
      cy.get(".landing-stat").eq(0).should("contain.text", "<1s finality");
      cy.get(".landing-stat").eq(1).should("contain.text", "USDC native");
      cy.get(".landing-stat").eq(2).should("contain.text", "Humans + Agents");
      cy.get(".landing-stat").eq(3).should("contain.text", "ERC-8004 reputation");
    });

    it("should display hero image", () => {
      cy.get(".landing-img-hero").first().should("be.visible");
    });
  });

  describe("Problem Section", () => {
    it("should display section title", () => {
      cy.get(".landing-ambient-section").first().within(() => {
        cy.get(".landing-h2").should("contain.text", "The old way still sucks.");
      });
    });

    it("should display 3 problem cards", () => {
      cy.get(".landing-grid-3 .landing-card").should("have.length", 3);
    });

    it("should show problem titles", () => {
      const titles = ["Slow money", "High fees, low trust", "AI agents are second-class"];
      titles.forEach((title) => {
        cy.get(".landing-card-title").contains(title).should("exist");
      });
    });
  });

  describe("How It Works Section", () => {
    it("should display section title", () => {
      cy.get("#how").within(() => {
        cy.get(".landing-h2").should("contain.text", "Work happens in six clear steps.");
      });
    });

    it("should display 6 steps", () => {
      cy.get(".landing-step").should("have.length", 6);
    });

    it("should display step numbers 1-6", () => {
      cy.get(".landing-step-num").each((el, i) => {
        cy.wrap(el).should("contain.text", String(i + 1));
      });
    });

    it("should have status badges on some steps", () => {
      cy.get("#how .status-badge").should("have.length.greaterThan", 0);
    });
  });

  describe("For Clients Section", () => {
    it("should display client heading", () => {
      cy.get("#clients").should("contain.text", "Post work. Lock payment. Get results.");
    });

    it("should display For clients label", () => {
      cy.get("#clients .landing-eyebrow").should("contain.text", "For clients");
    });

    it("should have Create your first job button", () => {
      cy.get("#clients button").should("contain.text", "Create your first job");
    });
  });

  describe("For Workers Section", () => {
    it("should display worker heading", () => {
      cy.get("#workers").should("contain.text", "Same rules. Same pay. Same reputation.");
    });

    it("should display For workers label", () => {
      cy.get("#workers .landing-eyebrow").should("contain.text", "For workers");
    });

    it("should show Humans and AI Agents cards", () => {
      cy.get("#workers .landing-subhead").should("have.length", 2);
      cy.get("#workers .landing-subhead").eq(0).should("contain.text", "Humans");
      cy.get("#workers .landing-subhead").eq(1).should("contain.text", "AI Agents");
    });
  });

  describe("Why Arc Section", () => {
    it("should display section title", () => {
      cy.contains(".landing-h2", "Built for this.").should("exist");
    });

    it("should display 4 feature cards", () => {
      cy.contains(".landing-h2", "Built for this.")
        .closest(".landing-section")
        .find(".landing-card")
        .should("have.length", 4);
    });
  });

  describe("Example Jobs Section", () => {
    it("should display Example open jobs heading", () => {
      cy.contains(".landing-h2", "Example open jobs").should("exist");
    });

    it("should display job cards", () => {
      cy.get(".landing-job").should("have.length", 2);
    });

    it("should show job titles", () => {
      cy.get(".landing-job-title").eq(0).should("contain.text", "Production-grade smart contract audit");
      cy.get(".landing-job-title").eq(1).should("contain.text", "Scrape and format 10k legal PDFs");
    });

    it("should show budgets", () => {
      cy.get(".landing-job-budget strong").eq(0).should("contain.text", "850 USDC");
      cy.get(".landing-job-budget strong").eq(1).should("contain.text", "200 USDC");
    });

    it("should link to /jobs", () => {
      cy.get(".landing-job").first().should("have.attr", "href", "/jobs");
    });

    it("should have See all open jobs link", () => {
      cy.get(".landing-teaser-link").should("contain.text", "See all open jobs");
      cy.get(".landing-teaser-link").should("have.attr", "href", "/jobs");
    });
  });

  describe("Final CTA Section", () => {
    it("should display CTA heading", () => {
      cy.contains("h2", "Ready to stop waiting for payments?").should("exist");
    });

    it("should have Browse jobs and Post a job buttons", () => {
      cy.get(".landing-final a").should("have.length", 2);
      cy.get('.landing-final a[href="/jobs"]').should("contain.text", "Browse jobs");
      cy.get('.landing-final a[href="/jobs/new"]').should("contain.text", "Post a job");
    });
  });

  describe("Footer", () => {
    it("should display footer brand", () => {
      cy.get(".landing-footer-brand").should("contain.text", "Arc WorkNet");
    });

    it("should display disclaimer text", () => {
      cy.get(".landing-footer-blurb").should(
        "contain.text",
        "experimental MVP on Arc Testnet"
      );
    });

    it("should have Resources links", () => {
      cy.get(".landing-footer-col").first().within(() => {
        cy.get("h4").should("contain.text", "Resources");
        cy.get('a[href="/jobs"]').should("contain.text", "Browse jobs");
      });
    });

    it("should have Protocol links", () => {
      cy.get(".landing-footer-col").last().within(() => {
        cy.get("h4").should("contain.text", "Protocol");
        cy.get('a[href="/dashboard"]').should("contain.text", "Dashboard");
      });
    });

    it("should have Arcscan external link", () => {
      cy.get('.landing-footer a[target="_blank"]')
        .first()
        .should("have.attr", "href")
        .and("include", "arcscan");
    });
  });

  describe("Responsive - Mobile", () => {
    beforeEach(() => {
      cy.viewport(375, 667);
    });

    it("should still show brand", () => {
      cy.get(".landing-brand").should("be.visible");
    });

    it("should still show hero title", () => {
      cy.get(".landing-hero-title").should("be.visible");
    });

    it("should still show CTA buttons", () => {
      cy.get(".landing-cta-row").first().should("be.visible");
    });
  });

  describe("Responsive - Tablet", () => {
    beforeEach(() => {
      cy.viewport(768, 1024);
    });

    it("should still show all sections", () => {
      cy.get(".landing-hero").should("exist");
      cy.get(".landing-footer").should("exist");
    });
  });
});
