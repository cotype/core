import { Router } from "express";
import { ResponseHeaders, ExternalDataSource, Models } from "../../typings";
import { Persistence } from "../persistence";
import routes from "./routes";
import describe from "./describe";
import graphql from "./graphql";
import rest, { getApiBuilder as getRestApiBuilder } from "./rest";

export { getRestApiBuilder };

type Opts = {
  persistence: Persistence;
  models: Models;
  externalDataSources: ExternalDataSource[];
  basePath: string;
  mediaUrl: string;
  responseHeaders?: ResponseHeaders;
};

export default (opts: Opts) => {
  return {
    describe,
    routes(router: Router) {
      routes(router, opts);
      rest(router, opts);
      graphql(router, opts);
    }
  };
};
