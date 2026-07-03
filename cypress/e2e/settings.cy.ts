describe('Settings Pages', () => {
  it('renders profile form', () => {
    cy.visit('/settings/profile', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', 'Profile')
    cy.get('form').should('exist') // Might not show if not authed, but assuming UI check
  })

  it('renders new agent form', () => {
    cy.visit('/settings/agents/new', { failOnStatusCode: false })
    cy.get('h1').should('exist')
    cy.get('form').should('exist')
  })
})
