describe('Register page - E2E tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/register');
  });

  it('shows required validation when submitting empty form', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('exist').and('contain', 'กรุณากรอกข้อมูลที่จำเป็น');
  });

  it('validates email format', () => {
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="email"]').type('not-an-email');
    cy.get('input[name="fullName"]').type('Full Name');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('123456');

    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('exist').and('contain', 'กรุณากรอกอีเมลให้ถูกต้อง');
  });

  it('validates password mismatch', () => {
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="email"]').type('a@b.com');
    cy.get('input[name="fullName"]').type('Full Name');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('1234567');

    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('exist').and('contain', 'รหัสผ่านไม่ตรงกัน');
  });

  it('validates short password', () => {
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="email"]').type('a@b.com');
    cy.get('input[name="fullName"]').type('Full Name');
    cy.get('input[name="password"]').type('123');
    cy.get('input[name="confirmPassword"]').type('123');

    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('exist').and('contain', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
  });

  it('submits registration successfully (stubbed)', () => {
    cy.intercept('POST', '/account/register', {
      statusCode: 200,
      body: { success: true }
    }).as('registerStub');

    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="email"]').type('a@b.com');
    cy.get('input[name="fullName"]').type('Full Name');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('123456');

    cy.get('button[type="submit"]').click();
    cy.wait('@registerStub').its('request.body').should(body => {
      expect(body.username).to.equal('newuser');
      expect(body.password).to.equal('123456');
    });

    cy.get('.success-message').should('exist').and('contain', 'สมัครสมาชิกสำเร็จ');

    // After successful register the component navigates to /login after ~2s
    cy.url().should('not.include', '/login');
    cy.wait(2100);
    cy.url().should('include', '/login');
  });

  it('shows server error on failed register (stubbed 400)', () => {
    cy.intercept('POST', '/account/register', {
      statusCode: 400,
      body: { success: false, message: 'อีเมลนี้ถูกใช้ไปแล้ว' }
    }).as('registerFail');

    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="email"]').type('a@b.com');
    cy.get('input[name="fullName"]').type('Full Name');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[name="confirmPassword"]').type('123456');

    cy.get('button[type="submit"]').click();
    cy.wait('@registerFail');
    cy.get('.error-message').should('exist').and('contain', 'อีเมลนี้ถูกใช้ไปแล้ว');
  });
});