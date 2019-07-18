import {
  Models,
  ExternalDataSource,
  BaseUrls,
  ResponseHeaders
} from "../../typings";
import routes from "./routes";
import describe from "./describe";
import graphql from "./graphql";
import rest, { getApiBuilder as getRestApiBuilder } from "./rest";

import { Router } from "express";
import { Persistence } from "../persistence";

export { getRestApiBuilder };

export default (
  persistence: Persistence,
  models: Models,
  externalDataSources: ExternalDataSource[],
  baseUrls: BaseUrls,
  responseHeaders?: ResponseHeaders
) => {
  return {
    describe,
    routes(router: Router) {
      routes(router, persistence, models, externalDataSources);
      rest(
        router,
        persistence,
        models,
        externalDataSources,
        baseUrls,
        responseHeaders ? responseHeaders.rest : undefined
      );
      graphql(router, persistence, models);
    }
  };
};
