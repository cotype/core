"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTypeName = exports.addExternalModel = exports.addModel = exports.modelSchema = exports.createDefinition = exports.body = exports.param = exports.array = exports.object = exports.ref = exports.empty = exports.scalars = exports.media = exports.integer = exports.float = exports.boolean = exports.string = void 0;
const lodash_1 = __importStar(require("lodash"));
const changeCase = __importStar(require("change-case"));
const stringType = { type: "string" };
exports.string = stringType;
const booleanType = { type: "boolean" };
exports.boolean = booleanType;
const float = { type: "number" };
exports.float = float;
const integer = { type: "integer" };
exports.integer = integer;
exports.media = {
    type: "object",
    properties: {
        _id: { type: "string" },
        _ref: { type: "string", enum: ["media"] },
        _src: { type: "string" }
    },
    required: ["_id", "_ref", "_src"]
};
exports.scalars = {
    string: stringType,
    position: stringType,
    date: stringType,
    boolean: booleanType,
    number: float
};
exports.empty = {};
exports.ref = Object.assign((comp) => ({ $ref: `#/components/${comp}` }), {
    response: (name) => (0, exports.ref)(`responses/${name}`),
    schema: (name) => (0, exports.ref)(`schemas/${name}`),
    param: (name) => (0, exports.ref)(`parameters/${name}`),
    params: (...names) => names.map(exports.ref.param)
});
exports.object = Object.assign((properties) => ({ type: "object", properties }), {
    required: (...required) => (properties) => ({
        type: "object",
        required,
        properties
    })
});
function array(items) {
    return { type: "array", items };
}
exports.array = array;
function paramBuilder(defaults) {
    return (name, opts) => {
        return { name, in: "path", ...defaults, ...opts };
    };
}
exports.param = Object.assign(paramBuilder({ required: true }), {
    query: paramBuilder({ in: "query" })
});
function body(props) {
    return {
        content: {
            "application/json": {
                schema: (0, exports.object)(props)
            }
        }
    };
}
exports.body = body;
const refs = {};
function createDefinition(model, external, api) {
    if (!model)
        return exports.empty;
    if (model.type in exports.scalars)
        return exports.scalars[model.type];
    if (model.type === "object") {
        const schema = {
            type: "object",
            properties: lodash_1.default.mapValues(model.fields, field => createDefinition(field, external, api)),
            required: Object.entries(model.fields)
                .map(([key, value]) => (value.type === "virtual" && value.get) ||
                value.required
                ? key
                : null)
                .filter(Boolean)
        };
        if (model.typeName) {
            const typeName = (0, exports.toTypeName)(model.typeName);
            if (!refs[typeName]) {
                api.addSchema(typeName, schema);
                refs[typeName] = schema;
            }
            else {
                if (!(0, lodash_1.isEqual)(refs[typeName], schema)) {
                    throw new Error(`Object key "typeName" is used for different element: ${typeName}`);
                }
            }
            return exports.ref.schema((0, exports.toTypeName)(model.typeName));
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
        return exports.media;
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
                const typeName = (0, exports.toTypeName)(model.typeName);
                if (!refs[typeName]) {
                    api.addSchema(typeName, schema);
                    refs[typeName] = schema;
                }
                else {
                    if (!(0, lodash_1.isEqual)(refs[typeName], schema)) {
                        throw new Error(`List key "typeName" is used for different element: ${typeName}`);
                    }
                }
                return exports.ref.schema((0, exports.toTypeName)(model.typeName));
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
            return exports.empty;
        }
        return {
            type: model.outputType
        };
    }
    return exports.ref.schema(model.type);
}
exports.createDefinition = createDefinition;
function modelSchema(model, external, api) {
    return {
        type: "object",
        properties: lodash_1.default.mapValues(model.fields, field => createDefinition(field, external, api)),
        required: Object.entries(model.fields)
            .map(([key, value]) => (value.type === "virtual" && value.get) ||
            value.required
            ? key
            : null)
            .filter(Boolean)
    };
}
exports.modelSchema = modelSchema;
function addModel(api, model) {
    const TypeName = (0, exports.toTypeName)(model.name);
    api.addSchema(TypeName, modelSchema(model, false, api));
    return exports.ref.schema(TypeName);
}
exports.addModel = addModel;
function addExternalModel(api, model) {
    const TypeName = (0, exports.toTypeName)(model.name);
    api.addSchema(TypeName, modelSchema(model, true, api));
    return exports.ref.schema(TypeName);
}
exports.addExternalModel = addExternalModel;
const toTypeName = (name) => {
    return changeCase.pascalCase(name);
};
exports.toTypeName = toTypeName;
//# sourceMappingURL=oapi.js.map