describe('Additional pages: contact and workout-history', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('visits contact page and submits form (stubbed)', () => {
    cy.intercept('POST', '/contact', (req) => {
      req.reply({ statusCode: 201, body: { id: 123, name: req.body.name, email: req.body.email, message: req.body.message } });
    }).as('postContact');

    cy.visit('/contact');
    cy.contains('ติดต่อเรา').should('exist');

    cy.get('input[name="name"]').type('E2E Tester');
    cy.get('input[name="email"]').type('e2e@test.local');
    cy.get('textarea[name="message"]').type('This is an automated test message');
    cy.get('button[type="submit"]').click();

    cy.wait('@postContact').its('request.body').should('include', {
      name: 'E2E Tester',
      email: 'e2e@test.local',
      message: 'This is an automated test message'
    });

    // Expect a success UI — the exact text may vary, check for a thank-you or redirect
    cy.contains('ขอบคุณ').should('exist');
  });

  it('visits workout-history (authenticated) and checks UI', () => {
    const user = { account_id: 40, username: 'tester40', role: 'user' };
    cy.window().then(win => win.localStorage.setItem('currentUser', JSON.stringify(user)));

    // stub workout history API used by component
    cy.intercept('GET', '/workout-history/member/*', { statusCode: 200, body: [ { id: 1, date: '2025-10-01', activity: 'Running', duration: 30 } ] }).as('getWorkouts');

    cy.visit('/workout-history');
    cy.wait('@getWorkouts');
    cy.contains('ประวัติการออกกำลังกาย').should('exist');
    cy.contains('Running').should('exist');
  });
});
