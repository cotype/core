export default class List {
  addButton() {
    return cy.testable("add-button");
  }
  add() {
    this.addButton().click();
  }
  saveButton() {
    return cy.get("button").contains("Save");
  }
  save() {
    this.saveButton().click();
  }

  deleteButton() {
    return cy.testable("delete");
  }
  delete() {
    this.deleteButton().click();
  }
  publishButton() {
    return cy.get("button").contains("Publish");
  }
  publish() {
    this.publishButton().click();
  }
  unpublishButton() {
    return cy.get("button").contains("Unpublish");
  }
  unpublish() {
    this.unpublishButton().click();
  }
  set(name, value, selector = 'input[name="%s"]') {
    cy.get(selector.replace("%s", name)).type(value);
  }
  listItem(title) {
    return cy.testableContains("list-item", title);
  }
}
