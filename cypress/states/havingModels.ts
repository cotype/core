import { ModelOpts } from "../../typings";

export default function havingModels(models: ModelOpts[]) {
  before(() => {
    cy.reinit({
      models,
      navigation: []
    });
  });
}
