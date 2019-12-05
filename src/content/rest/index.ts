import { Models, ExternalDataSource, ResponseHeaders } from "../../../typings";
import { OpenApiBuilder } from "openapi3-ts";
import createApiBuilder from "./getApiBuilder";
import routes from "./routes";
import describe from "./describe";
import swaggerUi from "../../api/swaggerUi";

import urlJoin from "url-join";
import { Router } from "express";
import { Persistence } from "../../persistence";

export function getApiBuilder(
  models: Models,
  basePath: string
): OpenApiBuilder {
  const apiBuilder = createApiBuilder(basePath);
  describe(apiBuilder, models);

  return apiBuilder;
}

type Opts = {
  persistence: Persistence;
  models: Models;
  externalDataSources: ExternalDataSource[];
  basePath: string;
  mediaUrl: string;
  responseHeaders?: ResponseHeaders;
};

export default function rest(
  router: Router,
  {
    persistence,
    models,
    externalDataSources,
    basePath,
    mediaUrl,
    responseHeaders
  }: Opts
) {
  const apiBuilder = getApiBuilder(models, basePath);
  router.get("/rest", (req, res) => res.redirect(urlJoin(basePath, "docs/")));
  router.get("/rest/swagger.json", (req, res) => {
    res.json(apiBuilder.getSpec());
  });
  routes(
    router,
    persistence,
    models.content,
    externalDataSources,
    mediaUrl,
    responseHeaders
  );

  router.use(
    "/docs",
    swaggerUi(
      urlJoin(basePath, "docs/"),
      urlJoin(basePath, "rest/swagger.json")
    )
  );
}
