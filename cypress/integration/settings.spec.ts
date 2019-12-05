import frame from "../pages/frame";
import loginPage from "../pages/login";
import { roles, users } from "../pages/settings";

import mockedModels from "../mocks/models";

context("Settings", () => {
  let session: string;
  before(() => {
    cy.reinit({ models: mockedModels(4), navigation: [] }, "reset");
    cy.login().then(s => (session = s));
  });

  beforeEach(() => {
    cy.restoreSession(session);
  });

  before(() => {
    cy.randomStr("test-role-%s").as("roleName");
    cy.randomStr("Test-user-%s").as("userName");
    cy.randomStr("test-user-%s@example.org").as("userEmail");
    cy.randomStr("https://x%s.example.org", 7).as("origin");
    cy.randomStr(20).as("password");
  });

  it("has Users and Roles", () => {
    frame.navigation("Settings").click();
    frame.sidebarItem("Users").should("have.length", 1);
    frame.sidebarItem("Roles").should("have.length", 1);
  });

  it("allows creating a new role", () => {
    cy.withContext(({ roleName }) => {
      frame.navigation("Settings").click();
      frame.sidebarItem("Roles").click();
      roles.add();
      roles.setName(roleName);
      roles.addContent({ label: "Foo", value: "foos" }, "edit");
      roles.save();
      roles.listItem(roleName).should("have.length", 1);
    });
  });

  it("allows creating a new user", () => {
    cy.withContext(({ userName, userEmail, roleName, password }) => {
      frame.navigation("Settings").click();
      frame.sidebarItem("Users").click();
      users.add();
      users.setName(userName);
      users.setEmail(userEmail);
      users.selectRole(roleName);
      users.setPassword(password);
      users.save();
      users.listItem(userName).should("have.length", 1);
    });
  });

  it("creates a user that actually can log in", () => {
    cy.withContext(({ userEmail, password, userName }) => {
      cy.login({ email: userEmail, password, name: userName });
      frame.navigation("Settings").should("not.exist");
      frame.navigation("Content").click();
      frame.sidebarItems().should("have.length", 1);
      frame.sidebarItem("Foos").should("have.length", 1);
    });
  });

  it("allows deleting a user", () => {
    cy.withContext(({ userName }) => {
      frame.navigation("Settings").click();
      frame.sidebarItem("Users").click();
      users.listItem(userName).click();
      users.delete();
      users.listItem(userName).should("have.length", 0);
    });
  });

  it("prevents deleted user from logging in again", () => {
    cy.withContext(({ userEmail, password }) => {
      cy.logout();
      loginPage.login(userEmail, password);

      loginPage.profile().should("have.length", 0);
      loginPage.email().should("have.value", "");
    });
  });

  it("allows deleting a role", () => {
    cy.withContext(({ roleName }) => {
      frame.navigation("Settings").click();
      frame.sidebarItem("Roles").click();
      roles.listItem(roleName).click();
      roles.delete();
      roles.listItem(roleName).should("have.length", 0);
    });
  });
});
