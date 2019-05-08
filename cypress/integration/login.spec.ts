import whenLoggedOut from "../states/loggedOut";
import loginPage from "../pages/login";

context("Login", () => {
  whenLoggedOut();

  it("logs in", () => {
    loginPage.login("admin@cotype.dev", "admin");

    loginPage.profile().should("have.text", "Ad");
  });

  it("does not log in when credentials are wrong", () => {
    loginPage.login("admin@cotype.dev", "foo");

    loginPage.profile().should("have.length", 0);
    loginPage.email().should("have.value", "");
  });
});
