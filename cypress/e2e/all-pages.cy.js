describe('Smoke test — all main pages', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('visits public pages and checks main UI elements', () => {
    // stub course list
    cy.intercept('GET', '/course', {
      statusCode: 200,
      body: [
        { course_id: 1, course_name: 'Course One', description: 'Desc', duration: '4 weeks', price: 1000, img_url: '', level: 'beginner', tags: '' }
      ]
    }).as('getCourses');

    cy.visit('/');
    cy.contains('คอร์ส').should('exist');

    cy.visit('/course');
    cy.wait('@getCourses');
    cy.contains('Course One').should('exist');

    // go to enrollment page using query param (component expects ?id=)
    // stub course detail and profile endpoints used on enrollment
    cy.intercept('GET', '/course/1', { statusCode: 200, body: { course_id: 1, course_name: 'Course One', price: 1000, img_url: '' } }).as('getCourse1');
    cy.intercept('GET', '/account/profile/*', { statusCode: 200, body: { full_name: 'Tester', email: 't@t.com', phone: '0812345678' } }).as('getProfile');

    cy.visit('/course-enrollment?id=1');
    cy.wait('@getCourse1');
    // enrollment form should show course price and promptpay section (auto)
    cy.contains('ชำระด้วยพร้อมเพย์').should('exist');
    cy.contains('1000').should('exist');
  });

  it('visits trainer, profile and registration pages (requires stubbed user)', () => {
    // put a logged-in user into localStorage so guarded pages render correctly
    const user = { account_id: 30, username: 'Bank', role: 'admin' };
    cy.window().then(win => {
      win.localStorage.setItem('currentUser', JSON.stringify(user));
    });

    // Trainer listing (stub backend)
    cy.intercept('GET', '/trainer', { statusCode: 200, body: [{ account_id: 10, name: 'Trainer A', bio: 'Bio' }] }).as('getTrainers');
    cy.visit('/trainer');
    cy.wait('@getTrainers');
    cy.contains('เทรนเนอร์').should('exist');

    // Profile should load using our stubbed user
    cy.intercept('GET', '/account/profile/30', { statusCode: 200, body: { full_name: 'Bank Tester', email: 'bank@test', phone: '0812345678' } }).as('getProfile30');
    cy.visit('/profile');
    cy.wait('@getProfile30');
    cy.contains('Bank Tester').should('exist');

    // Registration history
    cy.intercept('GET', '/enroll/member/30', { statusCode: 200, body: [] }).as('getEnrollments');
    cy.visit('/registration-history');
    cy.wait('@getEnrollments');
    cy.contains('ประวัติการสมัคร').should('exist');
  });

  it('opens admin page (requires admin user)', () => {
    const admin = { account_id: 30, username: 'Bank', role: 'admin', fullName: 'Admin Bank' };
    cy.window().then(win => win.localStorage.setItem('currentUser', JSON.stringify(admin)));

    // stub admin endpoints used by AdminComponent
    cy.intercept('GET', '/account', { statusCode: 200, body: [{ account_id: 30, username: 'Bank', role: 'admin' }] }).as('getUsers');
    cy.intercept('GET', '/course', { statusCode: 200, body: [] }).as('getCoursesAdmin');
    cy.intercept('GET', '/contact', { statusCode: 200, body: [] }).as('getMessages');

    cy.visit('/admin');
    cy.wait('@getUsers');
    cy.contains('หน้าจัดการระบบ').should('exist');
  });
});