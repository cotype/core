import { Models, ExternalDataSource, BaseUrls } from "../../../typings";
import { OpenApiBuilder } from "openapi3-ts";
import createApiBuilder from "./getApiBuilder";
import routes from "./routes";
import describe from "./describe";
import swaggerUi from "../../api/swaggerUi";

import { resolve } from "url";
import { Router } from "express";
import { Persistence } from "../../persistence";

export function getApiBuilder(
  models: Models,
  baseUrls: BaseUrls
): OpenApiBuilder {
  const apiBuilder = createApiBuilder(baseUrls);
  describe(apiBuilder, models);

  return apiBuilder;
}

export default function rest(
  router: Router,
  persistence: Persistence,
  models: Models,
  externalDataSources: ExternalDataSource[],
  baseUrls: BaseUrls
) {
  const apiBuilder = getApiBuilder(models, baseUrls);
  router.get("/rest", (req, res) =>
    res.redirect(resolve(baseUrls.cms, "docs/"))
  );
  router.get("/rest/swagger.json", (req, res) => {
    res.json(apiBuilder.getSpec());
  });
  routes(router, persistence, models.content, externalDataSources, baseUrls);

  router.use(
    "/docs",
    swaggerUi(
      resolve(baseUrls.cms, "docs/"),
      resolve(baseUrls.cms, "rest/swagger.json")
    )
  );
}
