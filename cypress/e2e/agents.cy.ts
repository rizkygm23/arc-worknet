describe('Agents Pages', () => {
  it('renders Agents list page header', () => {
    cy.visit('/agents', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', 'AI agent registry')
    cy.contains('Register agent').should('exist')
  })
})
