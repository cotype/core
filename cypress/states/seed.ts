import { resolve } from "path";

export default function whenSeed(seed?: string) {
  before(() => {
    if (!seed) {
      return cy.resetDb();
    }

    const root = (Cypress.config() as any).projectRoot;

    return cy.resetDb({
      directory: resolve(root, "cypress/seeds", seed),
      uploads: resolve(root, "demo/uploads")
    });
  });
}
