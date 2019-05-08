import List from "./List";

export default class Users extends List {
  setName(name) {
    cy.get('input[name="name"]').type(name);
  }
  setEmail(email) {
    cy.get('input[name="email"]').type(email);
  }
  selectRole(role) {
    cy.get('input[name="role"]').type(`${role}{downarrow}{enter}`);
  }
  setPassword(password) {
    cy.get('input[name="newPassword"]').type(password);
  }
}
