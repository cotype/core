import { Models, ExternalDataSource, BaseUrls } from "../../../typings";
import getApiBuilder from "./getApiBuilder";
import routes from "./routes";
import describe from "./describe";
import swaggerUi from "../../api/swaggerUi";

import { resolve } from "url";
import { Router } from "express";
import { Persistence } from "../../persistence";

export default function rest(
  router: Router,
  persistence: Persistence,
  models: Models,
  externalDataSources: ExternalDataSource[],
  baseUrls: BaseUrls
) {
  const apiBuilder = getApiBuilder(baseUrls);
  describe(apiBuilder, models);
  router.get("/rest", (req, res) => res.redirect("/docs/"));
  router.get("/rest/swagger.json", (req, res) => {
    res.json(apiBuilder.getSpec());
  });
  routes(router, persistence, models.content, externalDataSources, baseUrls);

  router.use(
    "/docs",
    swaggerUi(resolve(baseUrls.cms || "/", "rest/swagger.json"))
  );
}
