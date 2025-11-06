// custom commands can be added here
Cypress.Commands.add('loginViaUI', (username, password) => {
  cy.visit('/login');
  cy.get('input[name="username"]').clear().type(username);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
});
