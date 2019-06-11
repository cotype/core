import List from "./List";

export default class Content extends List {
  upload(file: Cypress.FileData) {
    cy.testable("upload-zone").upload(file, { subjectType: "drag-n-drop" });
  }
}
