import { Models } from "../../../typings";
// import { buildSchema } from "./schema";
import { Router } from "express";
import { Persistence } from "../../persistence";

export default function graphql(
  router: Router,
  persistence: Persistence,
  models: Models
) {
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
