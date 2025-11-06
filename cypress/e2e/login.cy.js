describe('Login page - E2E tests', () => {
  beforeEach(() => {
    // clear any local storage / session state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('shows validation and prevents submit when fields empty', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').should('be.disabled');

    // fill only username -> still disabled
    cy.get('input[name="username"]').type('testuser');
    cy.get('button[type="submit"]').should('be.disabled');

    // fill password -> enabled
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('logs in successfully with stubbed backend', () => {
    cy.intercept('POST', '/account/login', {
      statusCode: 200,
      body: { success: true, message: 'เข้าสู่ระบบสำเร็จ', user: { account_id: 30, username: 'Bank', role: 'admin' } }
    }).as('loginStub');

    cy.visit('/login');
    cy.get('input[name="username"]').type('Bank');
    cy.get('input[name="password"]').type('111111');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginStub').its('request.body').should('deep.equal', { username: 'Bank', password: '111111' });

    // After login the app should redirect away from /login (depending on app behavior)
    cy.url().should('not.include', '/login');

    // Navbar should show username or admin link (app-specific) — attempt a gentle check
    cy.get('body').should('not.contain', 'เข้าสู่ระบบ');
  });

  it('shows server error for bad credentials (stubbed 401)', () => {
    cy.intercept('POST', '/account/login', {
      statusCode: 401,
      body: { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
    }).as('loginFail');

    cy.visit('/login');
    cy.get('input[name="username"]').type('baduser');
    cy.get('input[name="password"]').type('badpass');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginFail');
    cy.get('.error-message').should('exist').and('contain.text', 'ชื่อผู้ใช้หรือรหัสผ่าน');
  });

  // Optional: an integration test that hits the real backend (uncomment to use)
  it('OPTIONAL: integration login (real backend)', () => {
    // To use this test: ensure backend is running at https://itbackend-production.up.railway.app and contains the test credentials
    // cy.visit('/login');
    // cy.get('input[name="username"]').type('Bank');
    // cy.get('input[name="password"]').type('111111');
    // cy.get('button[type="submit"]').click();
    // cy.url().should('not.include', '/login');
  });
});
