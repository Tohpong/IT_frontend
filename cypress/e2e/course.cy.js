describe('Course page automation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('loads course list and navigates to enrollment', () => {
    const courses = [
      { course_id: 1, course_name: 'HIIT Training', description: 'Intense workout', duration: '4 weeks', img_url: '', price: 1800, tags: 'ฟิตเนส,เริ่มต้น' },
      { course_id: 2, course_name: 'Yoga Basics', description: 'Calm and stretch', duration: '6 weeks', img_url: '', price: 1200, tags: 'โยคะ,เริ่มต้น' }
    ];

    cy.intercept('GET', '/course', { statusCode: 200, body: courses }).as('getCourses');
    cy.intercept('GET', '/course/1', { statusCode: 200, body: courses[0] }).as('getCourse1');

    cy.visit('/course');
    cy.wait('@getCourses');

    // course cards rendered
    cy.contains('HIIT Training').should('exist');
    cy.contains('Yoga Basics').should('exist');

    // click enroll on first course
    cy.get('.course-card').first().within(() => {
      cy.get('button.btn-success').click();
    });

    // should navigate to enrollment page with query param id=1
    cy.url().should('include', '/course-enrollment');
    cy.url().should('include', 'id=1');
  });
});
