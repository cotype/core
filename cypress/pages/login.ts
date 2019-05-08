export default {
  login(email, password) {
    this.email().type(email);
    cy.get("input[name=password]").type(password);
    cy.get("button[type=submit]").click();
  },
  profile() {
    return cy.testable("profile-image");
  },
  email() {
    return cy.get("input[name=email]");
  }
};
