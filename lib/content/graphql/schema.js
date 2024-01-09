"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSchema = void 0;
const lodash_1 = __importDefault(require("lodash"));
const log_1 = __importDefault(require("../../log"));
const graphql_1 = require("graphql");
const scalars = {
    string: graphql_1.GraphQLString,
    boolean: graphql_1.GraphQLBoolean,
    number: graphql_1.GraphQLFloat
};
function buildSchema(models) {
    let types = {};
    const builtIns = {};
    function createType(def, name) {
        if (def.type in scalars)
            return scalars[def.type];
        if (def.type in builtIns)
            return builtIns[def.type];
        if (def.type === "content") {
            // TODO: fix wrong schema -> needs to be models enum
            return types[def.model];
        }
        if (def.type === "object") {
            return new graphql_1.GraphQLObjectType({
                name,
                fields: () => lodash_1.default.mapValues(def.fields, (def2, prop) => ({
                    type: createType(def2, name + lodash_1.default.upperFirst(prop))
                }))
            });
        }
        if (def.type === "richtext") {
            // TODO Support returning deltas as JSON
            return graphql_1.GraphQLString;
        }
        if (def.type === "union") {
            return new graphql_1.GraphQLUnionType({
                name,
                types: Object.values(() => lodash_1.default.mapValues(def.types, (def2, prop) => ({
                    type: createType(def2, name + lodash_1.default.upperFirst(prop))
                })))
            });
        }
        if (def.type === "list") {
            return new graphql_1.GraphQLList(createType(def.item, name));
        }
        log_1.default.warn(`Unsupported type ${JSON.stringify(def)} at ${name}`);
        throw new Error(`Unknown type ${JSON.stringify(def)} at ${name}`);
    }
    builtIns.media = createType({ type: "object", fields: models.media.fields }, "media");
    types = lodash_1.default.zipObject(lodash_1.default.map(models.content, "name"), models.content.map(({ name, fields: f }) => {
        const def = { type: "object", fields: f };
        return createType(def, name);
    }));
    const fields = lodash_1.default.mapValues(types, type => ({
        type,
        args: {
            id: { type: graphql_1.GraphQLString }
        },
        resolve() {
            return {}; // TODO implement resolvers!
        }
    }));
    const query = new graphql_1.GraphQLObjectType({
        name: "Query",
        fields: fields
    });
    return new graphql_1.GraphQLSchema({ query });
}
exports.buildSchema = buildSchema;
//# sourceMappingURL=schema.js.map