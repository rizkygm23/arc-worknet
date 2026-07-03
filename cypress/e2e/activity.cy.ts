describe('Activity Page', () => {
  beforeEach(() => {
    cy.visit('/activity', { failOnStatusCode: false })
  })

  it('renders page header', () => {
    cy.get('h1').should('contain.text', 'Activity feed')
  })
})
