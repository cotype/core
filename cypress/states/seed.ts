import { resolve } from "path";
import { KnexConfig } from "../../src/persistence/adapter/knex";

export default function andSeed(seed?: string): Partial<KnexConfig> | "reset" {
  if (!seed) {
    return "reset";
  }

  const root = (Cypress.config() as any).projectRoot;

  return {
    seeds: {
      directory: resolve(root, "cypress/seeds", seed),
      uploads: resolve(root, "demo/uploads")
    }
  };
}
