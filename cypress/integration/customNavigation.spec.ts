import frame from "../pages/frame";

import mockedModels from "../mocks/models";
const models = mockedModels();

context("Custom Navigation", () => {
  let session: string;
  before(() => {
    cy.reinit({ models, navigation: [] }, "reset");
    cy.login().then(s => (session = s));
  });

  beforeEach(() => {
    cy.restoreSession(session);
  });

  it("displays all models as content", () => {
    frame.navigation("Content").click();
    frame.sidebarItem("Foos").should("have.length", 1);
    frame.sidebarItem("Bars").should("have.length", 1);
  });

  it("supports models as main navigation and displays unused as content", () => {
    cy.reinit({
      models,
      navigation: [
        {
          type: "model",
          name: "Custom Foos",
          model: "foos"
        }
      ]
    }).visit("/");

    frame.navigation("Custom Foos").should("have.length", 1);
    frame.navigation("Content").click();
    frame.sidebarItem("Bars").should("have.length", 1);
    frame.sidebarItems().should("have.length", 1);
  });

  describe("with groups", () => {
    before(() => {
      cy.reinit({
        models,
        navigation: [
          {
            type: "group",
            name: "Custom",
            items: [
              {
                type: "model",
                name: "Foos",
                model: "foos"
              },
              {
                type: "group",
                name: "Custom Group",
                items: [
                  {
                    type: "model",
                    name: "Bars",
                    model: "bars"
                  }
                ]
              }
            ]
          }
        ]
      }).visit("/");
    });

    it("does not display content tab when all models are used", () => {
      frame.navigation("Content").should("have.length", 0);
    });

    it("displays toggle subgroups in module sidebar", () => {
      frame.navigation("Custom").click();
      frame.sidebarItem("Foos").should("have.length", 1);
      frame.sidebarItem("Bars").should("have.length", 0);
      frame.navigationGroup("Custom Group").click();
      frame.sidebarItem("Bars").should("have.length", 1);
      frame.navigationGroup("Custom Group").click();
      frame.sidebarItem("Bars").should("have.length", 0);
    });
  });
});
