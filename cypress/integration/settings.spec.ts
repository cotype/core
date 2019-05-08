import whenHavingModels from "../states/havingModels";
import whenLoggedIn, { login } from "../states/loggedIn";
import { logout } from "../states/loggedOut";
import whenSeed from "../states/seed";
import withContext from "../states/context";

import frame from "../pages/frame";
import loginPage from "../pages/login";
import { roles, users } from "../pages/settings";

import mockedModels from "../mocks/models";

context("Settings", () => {
  whenSeed();
  whenHavingModels(mockedModels(4));
  whenLoggedIn();

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

  it(
    "allows creating a new role",
    withContext(({ roleName }) => {
      frame.navigation("Settings").click();
      frame.sidebarItem("Roles").click();
      roles.add();
      roles.setName(roleName);
      roles.addContent("foos", "edit");
      roles.save();
      roles.listItem(roleName).should("have.length", 1);
    })
  );

  it(
    "allows creating a new user",
    withContext(({ userName, userEmail, roleName, password }) => {
      frame.navigation("Settings").click();
      frame.sidebarItem("Users").click();
      users.add();
      users.setName(userName);
      users.setEmail(userEmail);
      users.selectRole(roleName);
      users.setPassword(password);
      users.save();
      users.listItem(userName).should("have.length", 1);
    })
  );

  it(
    "creates a user that actually can log in",
    withContext(({ userEmail, password, userName }) => {
      login({ email: userEmail, password, name: userName });
      frame.navigation("Settings").should("have.length", 0);
      frame.sidebarItems().should("have.length", 1);
      frame.sidebarItem("Foos").should("have.length", 1);
    })
  );

  it(
    "allows deleting a user",
    withContext(({ userName }) => {
      frame.navigation("Settings").click();
      frame.sidebarItem("Users").click();
      users.listItem(userName).click();
      users.delete();
      users.listItem(userName).should("have.length", 0);
    })
  );

  it(
    "prevents deleted user from logging in again",
    withContext(({ userEmail, password }) => {
      logout();
      loginPage.login(userEmail, password);

      loginPage.profile().should("have.length", 0);
      loginPage.email().should("have.value", "");
    })
  );

  it(
    "allows deleting a role",
    withContext(({ roleName }) => {
      frame.navigation("Settings").click();
      frame.sidebarItem("Roles").click();
      roles.listItem(roleName).click();
      roles.delete();
      roles.listItem(roleName).should("have.length", 0);
    })
  );
});
