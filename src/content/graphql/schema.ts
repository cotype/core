import { Models, Type, ObjectType } from "../../../typings";
import _ from "lodash";
import log from "../../log";
import {
  GraphQLSchema,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLList,
  GraphQLUnionType,
  GraphQLOutputType,
  Thunk,
  GraphQLFieldConfigMap
} from "graphql";

type TypeMap = {
  [index: string]: GraphQLOutputType;
};
const scalars: TypeMap = {
  string: GraphQLString,
  boolean: GraphQLBoolean,
  number: GraphQLFloat
};

export function buildSchema(models: Models) {
  let types: TypeMap = {};
  const builtIns: TypeMap = {};

  function createType(def: Type, name: string): GraphQLOutputType {
    if (def.type in scalars) return scalars[def.type];
    if (def.type in builtIns) return builtIns[def.type];

    if (def.type === "content") {
      // TODO: fix wrong schema -> needs to be models enum
      return types[def.model!];
    }

    if (def.type === "object") {
      return new GraphQLObjectType({
        name,
        fields: () =>
          _.mapValues(def.fields, (def2, prop) => ({
            type: createType(def2, name + _.upperFirst(prop))
          }))
      });
    }

    if (def.type === "richtext") {
      // TODO Support returning deltas as JSON
      return GraphQLString;
    }

    if (def.type === "union") {
      return new GraphQLUnionType({
        name,
        types: Object.values(() =>
          _.mapValues(def.types, (def2, prop) => ({
            type: createType(def2, name + _.upperFirst(prop))
          }))
        )
      });
    }

    if (def.type === "list") {
      return new GraphQLList(createType(def.item, name));
    }

    log.warn(`Unsupported type ${JSON.stringify(def)} at ${name}`);
    throw new Error(`Unknown type ${JSON.stringify(def)} at ${name}`);
  }

  builtIns.media = createType(
    { type: "object", fields: models.media.fields },
    "media"
  );

  types = _.zipObject(
    _.map(models.content, "name"),
    models.content.map(({ name, fields: f }) => {
      const def: ObjectType = { type: "object", fields: f };
      return createType(def, name);
    })
  );

  const fields: unknown = _.mapValues(types, type => ({
    type,
    args: {
      id: { type: GraphQLString }
    },
    resolve() {
      return {}; // TODO implement resolvers!
    }
  }));

  const query = new GraphQLObjectType({
    name: "Query",
    fields: fields as Thunk<GraphQLFieldConfigMap<any, any>>
  });

  return new GraphQLSchema({ query });
}
