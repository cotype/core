import { testableSelector } from "../support/commands";

function details(fileName: string) {
  const element = () => {
    return cy.testableContains("overlay", fileName);
  };
  return {
    should: element().should,
    alt() {
      return element().find(testableSelector("meta-data-alt"));
    },
    setAlt(text: string) {
      this.alt().type(text);
    },
    addTag(text: string) {
      element()
        .find(testableSelector("chip-list-input"))
        .type(text)
        .siblings("button")
        .click();
    },
    tag(text: string) {
      return element().contains("div", text);
    },
    deleteTag(text: string) {
      this.tag(text)
        .children("button")
        .click();
    },
    save() {
      element()
        .contains("button", "Save")
        .click();
    }
  };
}

export default {
  upload(files: Cypress.FileData | Cypress.FileData[]) {
    cy.testable("upload-zone").upload(files, { subjectType: "drag-n-drop" });
  },
  tile(fileName: string) {
    return cy
      .testableContains("media-caption", fileName, { timeout: 20000 })
      .closest(testableSelector("media-tile"));
  },
  delete(fileName: string) {
    this.tile(fileName)
      .find(testableSelector("media-delete"))
      .click();
  },
  details(fileName: string) {
    this.tile(fileName)
      .find(testableSelector("media-details"))
      .click();

    return details(fileName);
  }
};
