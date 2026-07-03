describe('Jobs Pages', () => {
  beforeEach(() => {
    cy.visit('/jobs', { failOnStatusCode: false })
  })

  it('renders Jobs list page header and actions', () => {
    cy.get('h1').should('exist')
    cy.contains('New job').should('exist')
  })

  it('displays filters on Jobs list', () => {
    cy.get('select').should('have.length.at.least', 2)
    cy.get('input').should('exist')
  })

  it('renders New Job page', () => {
    cy.visit('/jobs/new', { failOnStatusCode: false })
    cy.get('h1').should('exist')
    cy.get('form').should('exist')
  })
})
