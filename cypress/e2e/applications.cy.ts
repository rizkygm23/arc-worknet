describe('Applications Page', () => {
  beforeEach(() => {
    cy.visit('/applications', { failOnStatusCode: false })
  })

  it('renders page header', () => {
    cy.get('h1').should('exist') // Might render differently depending on auth state
  })
})
