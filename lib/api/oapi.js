import _, { isEqual } from "lodash";
import * as changeCase from "change-case";
const stringType = { type: "string" };
const booleanType = { type: "boolean" };
const float = { type: "number" };
const integer = { type: "integer" };
export { stringType as string, booleanType as boolean, float, integer };
export const media = {
    type: "object",
    properties: {
        _id: { type: "string" },
        _ref: { type: "string", enum: ["media"] },
        _src: { type: "string" }
    },
    required: ["_id", "_ref", "_src"]
};
export const scalars = {
    string: stringType,
    position: stringType,
    date: stringType,
    boolean: booleanType,
    number: float
};
export const empty = {};
export const ref = Object.assign((comp) => ({ $ref: `#/components/${comp}` }), {
    response: (name) => ref(`responses/${name}`),
    schema: (name) => ref(`schemas/${name}`),
    param: (name) => ref(`parameters/${name}`),
    params: (...names) => names.map(ref.param)
});
export const object = Object.assign((properties) => ({ type: "object", properties }), {
    required: (...required) => (properties) => ({
        type: "object",
        required,
        properties
    })
});
export function array(items) {
    return { type: "array", items };
}
function paramBuilder(defaults) {
    return (name, opts) => {
        return Object.assign(Object.assign({ name, in: "path" }, defaults), opts);
    };
}
export const param = Object.assign(paramBuilder({ required: true }), {
    query: paramBuilder({ in: "query" })
});
export function body(props) {
    return {
        content: {
            "application/json": {
                schema: object(props)
            }
        }
    };
}
const refs = {};
export function createDefinition(model, external, api) {
    if (!model)
        return empty;
    if (model.type in scalars)
        return scalars[model.type];
    if (model.type === "object") {
        const schema = {
            type: "object",
            properties: _.mapValues(model.fields, field => createDefinition(field, external, api)),
            required: Object.entries(model.fields)
                .map(([key, value]) => (value.type === "virtual" && value.get) ||
                value.required
                ? key
                : null)
                .filter(Boolean)
        };
        if (model.typeName) {
            const typeName = toTypeName(model.typeName);
            if (!refs[typeName]) {
                api.addSchema(typeName, schema);
                refs[typeName] = schema;
            }
            else {
                if (!isEqual(refs[typeName], schema)) {
                    throw new Error(`Object key "typeName" is used for different element: ${typeName}`);
                }
            }
            return ref.schema(toTypeName(model.typeName));
        }
        return schema;
    }
    if (model.type === "richtext") {
        if (external)
            return stringType;
        return {
            type: "object",
            properties: {}
        };
    }
    if (model.type === "content") {
        if (external)
            return {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    _ref: { type: "string", enum: [model.type] },
                    _content: {
                        type: "string",
                        enum: ("models" in model && model.models && model.models.length) ||
                            model.model
                            ? [
                                ...(("models" in model && model.models) || [model.model] ||
                                    [])
                            ]
                            : undefined
                    },
                    _url: { type: "string" }
                },
                required: ["_id", "_ref", "_content"]
            };
        return {
            type: "object",
            properties: {
                id: { type: "number" },
                model: { type: "string" }
            }
        };
    }
    if (model.type === "references") {
        return array({
            type: "object",
            properties: {
                _id: { type: "string" },
                _ref: { type: "string", enum: ["content"] },
                _content: {
                    type: "string",
                    enum: [model.model]
                },
                _url: { type: "string" }
            },
            required: ["_id", "_ref", "_content"]
        });
    }
    if (model.type === "settings") {
        return {
            type: "string",
            description: `${model.model} id`
        };
    }
    if (model.type === "media") {
        return media;
    }
    if (model.type === "union") {
        return {
            oneOf: Object.entries(model.types).map(([name, type]) => {
                const def = createDefinition(type, external, api);
                return {
                    allOf: [
                        def,
                        {
                            type: "object",
                            properties: {
                                _type: { type: "string", enum: [name] }
                            },
                            required: ["_type"]
                        }
                    ]
                };
            }),
            discriminator: {
                propertyName: "_type"
            }
        };
    }
    if (model.type === "list") {
        if (external) {
            const schema = array(createDefinition(model.item, external, api));
            if (model.typeName) {
                const typeName = toTypeName(model.typeName);
                if (!refs[typeName]) {
                    api.addSchema(typeName, schema);
                    refs[typeName] = schema;
                }
                else {
                    if (!isEqual(refs[typeName], schema)) {
                        throw new Error(`List key "typeName" is used for different element: ${typeName}`);
                    }
                }
                return ref.schema(toTypeName(model.typeName));
            }
            return schema;
        }
        return array({
            type: "object",
            properties: {
                key: { type: "number" },
                value: createDefinition(model.item, external, api)
            }
        });
    }
    if (model.type === "immutable") {
        return createDefinition(model.child, external, api);
    }
    if (model.type === "virtual") {
        if (!model.get) {
            return empty;
        }
        return {
            type: model.outputType
        };
    }
    return ref.schema(model.type);
}
export function modelSchema(model, external, api) {
    return {
        type: "object",
        properties: _.mapValues(model.fields, field => createDefinition(field, external, api)),
        required: Object.entries(model.fields)
            .map(([key, value]) => (value.type === "virtual" && value.get) ||
            value.required
            ? key
            : null)
            .filter(Boolean)
    };
}
export function addModel(api, model) {
    const TypeName = toTypeName(model.name);
    api.addSchema(TypeName, modelSchema(model, false, api));
    return ref.schema(TypeName);
}
export function addExternalModel(api, model) {
    const TypeName = toTypeName(model.name);
    api.addSchema(TypeName, modelSchema(model, true, api));
    return ref.schema(TypeName);
}
export const toTypeName = (name) => {
    return changeCase.pascalCase(name);
};
//# sourceMappingURL=oapi.js.map