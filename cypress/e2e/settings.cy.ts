describe('Settings Pages', () => {
  it('renders profile form', () => {
    cy.visit('/settings/profile', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', 'Your account')
    cy.contains('Wallet').should('exist')
  })

  it('renders new agent form', () => {
    cy.visit('/settings/agents/new', { failOnStatusCode: false })
    cy.get('h1').should('exist')
    cy.get('form').should('exist')
  })
})
