import { Models, ExternalDataSource, BaseUrls } from "../../../typings";
import apiBuilder from "./apiBuilder";
import routes from "./routes";
import describe from "./describe";
import swaggerUi from "../../api/swaggerUi";

import { Router } from "express";
import { Persistence } from "../../persistence";

export default function rest(
  router: Router,
  persistence: Persistence,
  models: Models,
  externalDataSources: ExternalDataSource[],
  baseUrls: BaseUrls
) {
  describe(apiBuilder, models);
  router.get("/rest", (req, res) => res.redirect("/docs/"));
  router.get("/rest/swagger.json", (req, res) => {
    res.json(apiBuilder.getSpec());
  });
  routes(router, persistence, models.content, externalDataSources, baseUrls);

  router.use("/docs", swaggerUi("/rest/swagger.json"));
}
