import loginPage from "../pages/login";
import { logout } from "./loggedOut";

import { admin } from "../mocks/users";

type User = {
  email: string;
  password: string;
  name: string;
};

export function login({ email, password, name }: User) {
  return logout().then(() => {
    loginPage.login(email, password);
    loginPage.profile().should("have.text", name.substring(0, 2));

    return cy.getCookie("session").then(({ value }) => value);
  });
}

export default function whenLoggedIn(user = admin) {
  let session = null;

  before(() => {
    return login(user).then(s => {
      session = s;
    });
  });

  beforeEach(() => {
    cy.setCookie("session", session);
    cy.visit("/");
  });
}
