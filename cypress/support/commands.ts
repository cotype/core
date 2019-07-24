import { ReinitOpts } from "../../demo/server/reinit";
import { resolve } from "path";
import { KnexConfig } from "../../src/persistence/adapter/knex";
import loginPage from "../pages/login";
import { admin } from "../mocks/users";

type User = {
  email: string;
  password: string;
  name: string;
};

export function testableSelector(id) {
  return `[data-testid="${id}"]`;
}

function random() {
  return Math.random()
    .toString(36)
    .substring(2);
}

Cypress.Commands.add("testable", (id, options) => {
  return cy.get(testableSelector(id), options);
});

Cypress.Commands.add("testableContains", (id, contains, options) => {
  return cy.contains(testableSelector(id), contains, options);
});

Cypress.Commands.add("reinit", (config, db) => {
  return cy.request("POST", "/admin/__reinit", {
    config,
    db
  });
});

Cypress.Commands.add("randomStr", (lengthI, templateI) => {
  const length = (typeof lengthI === "number" ? lengthI : templateI) || 10;
  const template = (typeof lengthI === "number" ? templateI : lengthI) || "%s";
  let str = "";
  while (str.length < length) {
    str += random();
  }
  return cy.wrap(template.replace("%s", str.substring(0, length)));
});

Cypress.Commands.add(
  "seed",
  (name: string): Partial<KnexConfig> => {
    const root = (Cypress.config() as any).projectRoot;

    return {
      seeds: {
        directory: resolve(root, "cypress/seeds", name),
        uploads: resolve(root, "demo/uploads")
      }
    };
  }
);

Cypress.Commands.add("withContext", function(
  cb: (context: Mocha.ITestCallbackContext) => any
) {
  return cb(this);
});

Cypress.Commands.add("logout", () => cy.clearCookies().visit("/"));
Cypress.Commands.add("login", ({ email, password, name }: User = admin) => {
  cy.logout();
  loginPage.login(email, password);
  loginPage.profile().should("have.text", name.substring(0, 2));
  return cy.getCookie("session").then(({ value }) => value);
});
Cypress.Commands.add("restoreSession", (session: string) => {
  return cy.setCookie("session", session).visit("/");
});

declare global {
  namespace Cypress {
    interface Chainable {
      logout: () => Cypress.Chainable<void>;
      login: (user?: User) => Promise<string>;
      restoreSession: (session: string) => Cypress.Chainable<JQuery>;
      withContext: (cb: (context: Mocha.ITestCallbackContext) => any) => any;
      seed: (name?: string) => Cypress.Chainable<Partial<KnexConfig>>;
      reinit: (
        config?: ReinitOpts["config"],
        db?: ReinitOpts["db"]
      ) => Cypress.Chainable<JQuery>;
      testable: (
        id: string,
        options?: Partial<Loggable & Timeoutable>
      ) => Cypress.Chainable<JQuery>;
      testableContains: (
        id: string,
        contains: string | number | RegExp,
        options?: Partial<Loggable & Timeoutable>
      ) => Cypress.Chainable<JQuery>;
      randomStr: (
        template?: string | number,
        length?: string | number
      ) => Cypress.Chainable<string>;
    }
  }
}
