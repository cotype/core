import List from "./List";

export default class Roles extends List {
  setName(name) {
    cy.get('input[name="name"]').type(name);
  }
  addContent(name, access) {
    cy.get('[data-name="permissions.content"]').click();
    cy.testableContains("action-item", name).click();
    cy.get(`select[name="permissions.content.${name}"]`).select(access);
  }
}
