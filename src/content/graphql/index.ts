import { Models, ExternalDataSource } from "../../../typings";
// import { buildSchema } from "./schema";
import { Router } from "express";
import { Persistence } from "../../persistence";

type Opts = {
  persistence: Persistence;
  models: Models;
  externalDataSources: ExternalDataSource[];
};

export default function graphql(router: Router, { persistence, models }: Opts) {
  /*
  var schema = buildSchema(models);
  const server = new ApolloServer({
    schema
    //playground: {
    //  "request.credentials": "same-origin"
    //}
  });
  server.applyMiddleware({ app });
  */
}
