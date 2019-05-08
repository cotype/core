import whenHavingModels from "../states/havingModels";
import whenLoggedIn from "../states/loggedIn";
import whenSeed from "../states/seed";
import withContext from "../states/context";

import frame from "../pages/frame";
import content from "../pages/content";
import api from "../pages/api";

import mockedModels from "../mocks/models";
import { mixedAccess } from "../mocks/users";

const drafts = api.rest.drafts();
const published = api.rest.published();

context("Access Control", () => {
  whenHavingModels(mockedModels(4));
  whenSeed("mixed-access");
  whenLoggedIn(mixedAccess);

  before(() => {
    cy.randomStr("test-baz-%s").as("bazName");
  });

  it("shows all three accessible contents in ui", () => {
    frame.navigation("Content").click();
    frame.sidebarItem("Foos").should("have.length", 0);
    frame.sidebarItem("Bars").should("have.length", 1);
    frame.sidebarItem("Bazs").should("have.length", 1);
    frame.sidebarItem("Quxes").should("have.length", 1);
  });

  describe("for view", () => {
    it("does not show edit buttons", () => {
      frame.sidebarItem("Bars").click();
      content.addButton().should("have.length", 0);
      content.listItem("Test Bar").click();
      content.saveButton().should("have.length", 0);
      content.deleteButton().should("have.length", 0);
    });

    it("lists contents", () => {
      published.get("bars").then(({ body: { total, items } }) => {
        expect(total).to.equal(1);
        expect(items[0].name).to.equal("Test Bar");
      });
    });
  });

  describe("for edit", () => {
    it(
      "allows content creation",
      withContext(({ bazName }) => {
        frame.sidebarItem("Bazs").click();
        content.add();
        content.set("name", bazName);
        content.save();
        content.listItem(bazName).should("have.length", 1);
        content.publishButton().should("have.length", 0);
        content.unpublishButton().should("have.length", 0);
      })
    );

    it(
      "lists new contents",
      withContext(({ bazName }) => {
        drafts.get("bazs").then(({ body: { total, items } }) => {
          expect(total).to.equal(2);
          expect(items.map(({ name }) => name)).to.deep.equal([
            bazName,
            "Test Baz"
          ]);
        });
      })
    );

    it("does not publish new contents", () => {
      published.get("bazs").then(({ body: { total, items } }) => {
        expect(total).to.equal(1);
        expect(items[0].name).to.equal("Test Baz");
      });
    });

    it(
      "allows content deletion",
      withContext(({ bazName }) => {
        frame.sidebarItem("Bazs").click();
        content.listItem(bazName).click();
        content.delete();
        content.listItem(bazName).should("have.length", 0);
      })
    );

    it("does not show deleted content", () => {
      drafts.get("bazs").then(({ body: { total, items } }) => {
        expect(total).to.equal(1);
        expect(items[0].name).to.equal("Test Baz");
      });
    });
  });

  describe("for publish", () => {
    it("allows content publishing", () => {
      frame.sidebarItem("Quxes").click();
      content.listItem("Test Qux").click();
      // Assert it's published
      published.get("quxs").should("have.deep.property", "body.total", 1);
      content.publishButton().should("have.length", 0);

      // Unpublish
      content.unpublish();
      content.unpublishButton().should("have.length", 0);
      published.get("quxs").should("have.deep.property", "body.total", 0);

      // Publish again
      content.publish();
      content.publishButton().should("have.length", 0);
      published.get("quxs").should("have.deep.property", "body.total", 1);
    });
  });
});
