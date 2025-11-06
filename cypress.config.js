const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "3hxk3u",

  e2e: {
    baseUrl: "http://localhost:4200",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.{js,ts}",
  },

  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
  },
});
