import "cypress-file-upload";
import frame from "../pages/frame";
import content from "../pages/content";
import media from "../pages/media";

import mockedModels from "../mocks/models";
const models = mockedModels(10);
const image1Name = "cy.png";

context("Media", () => {
  let image1Content: string;
  let session: string;

  before(() => {
    cy.login().then(s => (session = s));
    cy.fixture(image1Name, "base64").then(
      fileContent => (image1Content = fileContent)
    );
  });

  beforeEach(() => {
    cy.reinit({ models, navigation: [] }, "reset");
    cy.restoreSession(session);
    frame.navigation("Media").click();
  });

  it("uploads single file", () => {
    media.upload({
      fileContent: image1Content,
      fileName: image1Name,
      mimeType: "image/png"
    });

    media.tile(image1Name).should("have.length", 1);
  });

  it("uploads multiple files", () => {
    const files = [
      {
        fileName: "text1.txt",
        fileContent: "aGVsbG8gd29ybGQ=",
        mimeType: "text/plain"
      },
      {
        fileName: "text2.txt",
        fileContent: "d29ybGQgaGVsbG8=",
        mimeType: "text/plain"
      }
    ];
    media.upload(files);

    media.tile(files[0].fileName).should("have.length", 1);
    media.tile(files[1].fileName).should("have.length", 1);
  });

  it("shows duplicate error", () => {
    media.upload({
      fileContent: image1Content,
      fileName: image1Name,
      mimeType: "image/png"
    });
    media.tile(image1Name).should("have.length", 1);

    media.upload({
      fileContent: image1Content,
      fileName: image1Name,
      mimeType: "image/png"
    });
    cy.testableContains("overlay", image1Name).should("have.length", 1);
  });

  it("deletes files", () => {
    media.upload({
      fileContent: image1Content,
      fileName: image1Name,
      mimeType: "image/png"
    });
    media.tile(image1Name).should("have.length", 1);

    media.delete(image1Name);
    media.caption(image1Name).should("have.length", 0);
  });

  it("displays and saves media details", () => {
    const tags = ["tag", "that"];
    const altText = "foo baz bar";

    media.upload({
      fileContent: image1Content,
      fileName: image1Name,
      mimeType: "image/png"
    });

    const details = media.details(image1Name);
    details.should("have.length", 1);
    details.setAlt(altText);
    details.addTag(tags[0]);
    details.addTag(tags[1]);
    details.deleteTag(tags[0]);
    details.save();

    cy.reload();

    const details2 = media.details(image1Name);
    details2.alt().should("have.value", altText);
    details2.tag(tags[0]).should("have.length", 0);
    details2.tag(tags[1]).should("have.length", 1);
  });

  it("creates new content with media", () => {
    frame.navigation("Content").click();
    frame.sidebarItem("Media").click();

    content.add();
    content.upload({
      fileContent: image1Content,
      fileName: image1Name,
      mimeType: "image/png"
    });
    content.save();

    frame.navigation("Media").click();
    media.tile(image1Name).should("have.length", 1);
  });
});
