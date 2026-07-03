describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.visit('/dashboard', { failOnStatusCode: false })
  })

  it('renders dashboard headers and buttons', () => {
    cy.get('h1').should('contain.text', 'Welcome')
    cy.contains('Command center').should('exist')
    cy.contains('Track escrow, pending approvals').should('exist')
    cy.contains('New job').should('exist')
  })

  it('displays stat cards', () => {
    cy.contains('My jobs').should('exist')
    cy.contains('Pending review').should('exist')
    cy.contains('Escrowed').should('exist')
  })
})
