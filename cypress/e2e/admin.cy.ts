describe('Admin Pages', () => {
  it('renders Jobs moderation', () => {
    cy.visit('/admin/jobs', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', 'Job moderation')
    cy.get('table').should('exist')
  })

  it('renders Users page', () => {
    cy.visit('/admin/users', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', 'Users')
    cy.get('table').should('exist')
  })

  it('renders Event logs page', () => {
    cy.visit('/admin/event-logs', { failOnStatusCode: false })
    cy.get('h1').should('contain.text', 'Event logs')
  })
})
