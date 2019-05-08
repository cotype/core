import { Models, ExternalDataSource, BaseUrls } from "../../typings";
import routes from "./routes";
import describe from "./describe";
import graphql from "./graphql";
import rest from "./rest";

import { Router } from "express";
import { Persistence } from "../persistence";

export default (
  persistence: Persistence,
  models: Models,
  externalDataSources: ExternalDataSource[],
  baseUrls: BaseUrls
) => {
  return {
    describe,
    routes(router: Router) {
      routes(router, persistence, models, externalDataSources);
      rest(router, persistence, models, externalDataSources, baseUrls);
      graphql(router, persistence, models);
    }
  };
};
