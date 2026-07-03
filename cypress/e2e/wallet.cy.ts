describe('Wallet Page', () => {
  beforeEach(() => {
    cy.visit('/wallet', { failOnStatusCode: false })
  })

  it('renders page header and actions', () => {
    cy.get('h1').should('contain.text', 'Arc wallet')
    cy.contains('Connect wallet').should('exist') // Might show address if connected
  })

  it('displays stat cards', () => {
    cy.contains('Spendable').should('exist')
    cy.contains('Escrowed').should('exist')
    cy.contains('Network').should('exist')
  })
})
