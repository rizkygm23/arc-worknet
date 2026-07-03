describe('Workers Pages', () => {
  it('renders Workers list page header', () => {
    cy.visit('/workers', { failOnStatusCode: false })
    cy.get('h1').should('exist')
  })

  it('contains search and filters on list page', () => {
    cy.visit('/workers', { failOnStatusCode: false })
    cy.get('input[type="text"]').should('exist') // Search
    cy.get('select').should('have.length.at.least', 2)
  })
})
