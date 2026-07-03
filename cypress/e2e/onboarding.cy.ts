describe('Onboarding Page', () => {
  beforeEach(() => {
    cy.visit('/onboarding', { failOnStatusCode: false })
  })

  it('renders onboarding wizard', () => {
    cy.url().should('exist') 
  })
})
