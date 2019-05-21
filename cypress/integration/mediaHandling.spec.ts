import "cypress-file-upload";
import frame from "../pages/frame";
import content from "../pages/content";

import mockedModels from "../mocks/models";
const models = mockedModels(10);
const image1Name = "cy.png";

context("Media", () => {
  let image1Content: string;
  let session: string;

  before(() => {
    cy.reinit({ models, navigation: [] }, "reset");
    cy.login().then(s => (session = s));
    cy.fixture(image1Name, "base64").then(
      fileContent => (image1Content = fileContent)
    );
  });

  beforeEach(() => {
    cy.restoreSession(session);
    frame.navigation("Media").click();
  });

  it("upload single file", () => {
    cy.testable("upload-zone").upload(
      {
        fileContent: image1Content,
        fileName: image1Name,
        mimeType: "image/png"
      },
      { subjectType: "drag-n-drop" }
    );

    cy.testable("media-tile").contains(image1Name);
  });

  it("uploads multiple files", () => {
    const text1 = "aGVsbG8gd29ybGQ=";
    const text2 = "d29ybGQgaGVsbG8=";

    const files = [
      { fileName: "text1.txt", fileContent: text1, mimeType: "text/plain" },
      {
        fileName: "text2.txt",
        fileContent: text2,
        mimeType: "text/plain"
      }
    ];

    cy.testable("upload-zone").upload(files, {
      subjectType: "drag-n-drop"
    });
  });

  it("should show duplicate alter", () => {
    cy.testable("upload-zone").upload(
      {
        fileContent: image1Content,
        fileName: image1Name,
        mimeType: "image/png"
      },
      { subjectType: "drag-n-drop" }
    );
    cy.testableContains("overlay", image1Name);
  });

  it("should delete files", () => {
    cy.testable("media-delete").each(el => {
      el.click();
    });
  });

  it("show media details", () => {
    cy.testable("upload-zone").upload(
      {
        fileContent: image1Content,
        fileName: image1Name,
        mimeType: "image/png"
      },
      { subjectType: "drag-n-drop" }
    );

    cy.testable("media-details")
      .first()
      .as("media-tile")
      .click();
  });

  it("update meta data", () => {
    frame.navigation("Media").click();

    cy.testable("media-details")
      .first()
      .click();

    const altText = "foo baz bar";
    cy.testable("meta-data-alt")
      .as("alt-input")
      .type(altText);

    const tagText = "tag that";
    cy.testable("chip-list-input")
      .as("tag-input")
      .type(tagText)
      .siblings("button")
      .first()
      .click();

    cy.testable("chip-list-input")
      .as("tag-input")
      .type(tagText)
      .siblings("button")
      .first()
      .click();

    cy.contains("div", tagText)
      .children("button")
      .click();
    cy.contains("button", "Save").click();

    cy.reload();

    cy.testable("media-details")
      .first()
      .click();

    cy.testable("meta-data-alt").should("have.value", altText);
    cy.contains("div", tagText);
  });

  it("create new content with media", () => {
    frame.navigation("Content").click();
    frame.sidebarItem("Media").should("have.length", 1);

    frame.sidebarItem("Media").click();

    content.add();

    const fileName = "cy2.png";
    cy.fixture(fileName, "base64").then(fileContent => {
      cy.testable("upload-zone").upload(
        { fileContent, fileName, mimeType: "image/png" },
        { subjectType: "drag-n-drop" }
      );
      cy.testable("media-caption").contains(fileName);
      cy.testable("media-preview").should("have.attr", "src");
    });

    content.save();

    frame.navigation("Media").click();
    cy.testable("media-caption").contains(fileName);

    cy.go("back");
    content.delete();
  });
});
