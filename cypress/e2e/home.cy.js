describe('Home page automation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('loads home page and shows key sections', () => {
    // stub featured courses or any API the home page calls
    cy.intercept('GET', '/course', {
      statusCode: 200,
      body: [
        { course_id: 1, course_name: 'Course One', description: 'Desc', price: 1000, img_url: '' },
        { course_id: 2, course_name: 'Course Two', description: 'Desc 2', price: 1200, img_url: '' }
      ]
    }).as('getCourses');

    cy.visit('/');
    // basic nav exists
    cy.get('nav.top-nav').should('exist');
    cy.contains('คอร์ส').should('exist');
    cy.contains('เทรนเนอร์').should('exist');

    // wait for courses to load (if homepage fetches /course)
    cy.wait('@getCourses');

    // hero / main heading check — adapt if your app uses a different selector/text
    cy.get('h1, h2').then($els => {
      // ensure there's a prominent heading on the page
      expect($els.length).to.be.greaterThan(0);
    });

    // Featured course card presence
    cy.contains('Course One').should('exist');

    // navigation links work: click course nav and assert url
    cy.get('a.nav-item').contains('คอร์ส').click();
    cy.url().should('include', '/course');
  });
});
