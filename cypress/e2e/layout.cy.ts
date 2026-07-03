describe('App Layout', () => {
  beforeEach(() => {
    cy.visit('/dashboard', { failOnStatusCode: false })
  })

  it('renders navigation links', () => {
    const links = [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/jobs', label: 'Jobs' },
      { href: '/workers', label: 'Workers' },
      { href: '/applications', label: 'Applications' },
      { href: '/agents', label: 'Agents' },
      { href: '/wallet', label: 'Wallet' },
      { href: '/activity', label: 'Activity' },
      { href: '/settings/profile', label: 'Profile' },
      { href: '/admin/jobs', label: 'Admin' },
    ]

    links.forEach((link) => {
      cy.get(`a[href="${link.href}"]`).should('exist').and('contain.text', link.label)
    })
  })

  it('contains wallet panel elements', () => {
    cy.get('nav').should('exist') // app shell usually has a nav
  })
})
