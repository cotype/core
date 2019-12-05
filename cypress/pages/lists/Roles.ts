import List from "./List";

export default class Roles extends List {
  setName(name) {
    cy.get('input[name="name"]').type(name);
  }
  addContent(name: string | { label: string; value: string }, access) {
    const label = typeof name === "string" ? name : name.label;
    const value = typeof name === "string" ? name : name.value;

    cy.get('[data-name="permissions.content"]').click();
    cy.testableContains("action-item", label).click();
    cy.get(`select[name="permissions.content.${value}"]`).select(access);
  }
}
