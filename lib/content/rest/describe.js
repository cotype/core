import { ref, string, integer, float, array, object, param, addExternalModel, toTypeName, media } from "../../api/oapi";
import { hasType } from "../../model/introspection";
import { formats } from "../formatQuillDelta";
import visitModel from "../../model/visitModel";
import { isComparable } from "../../persistence/adapter/knex/lookup";
import pluralize from "pluralize";
import { searchableModelNames } from "./utils";
export const listSearchParams = {
    in: "query",
    name: `search`,
    style: "deepObject",
    explode: true,
    schema: {
        type: "object",
        properties: {
            term: string,
            scope: {
                type: "string",
                enum: ["title", "global"],
                default: "global"
            }
        }
    }
};
const refsSchema = (mediaType) => ({
    type: "object",
    properties: {
        media: {
            type: "object",
            additionalProperties: mediaType
        },
        content: {
            type: "object",
            properties: {}
        }
    }
});
const describeModel = (model, prefix = "", uniqueFields = [
    ...(model.uniqueFields || []),
    "title" in model ? model.title : "",
    "orderBy" in model ? model.orderBy : ""
]) => {
    let orderByEnums = [];
    let values = [];
    Object.entries(model.fields).forEach(([field, type]) => {
        if (type.type === "list" && type.item) {
            if (type.item.type === "object" && type.item.fields) {
                const sub = describeModel(type.item, prefix + field + ".", uniqueFields);
                values = [...values, ...sub.values];
                orderByEnums = [...orderByEnums, ...sub.orderByEnums];
                return;
            }
            if (type.item.type === "content") {
                values.push({
                    in: "query",
                    name: `data.${prefix + field}`,
                    style: "deepObject",
                    explode: true,
                    schema: criteria.content,
                    example: "{}",
                    description: ("allowAbsoluteRefs" in type.item && type.item.allowAbsoluteRefs
                        ? 'Query example: <tt>{"eq": "id"}</tt>, <tt>{"eq": "http://xx.xx"}</tt>'
                        : 'Query example: <tt>{"eq": "id"}</tt>') +
                        ', <tt>{"eq": "null"}</tt> or <tt>{"eq":"string“, "path":"field1.field2"}</tt>'
                });
                return;
            }
            if (type.item.type === "references") {
                values.push({
                    in: "query",
                    name: `data.${prefix + field}`,
                    style: "deepObject",
                    explode: true,
                    schema: criteria.content,
                    example: "{}",
                    description: 'Query example: <tt>{"eq": "id"}</tt>,  <tt>{"eq": "null"}</tt> or <tt>{"eq":"string“, "path":"field1.field2"}</tt>'
                });
            }
            if (!("index" in type.item)) {
                return;
            }
            if (type.item.type === "position") {
                orderByEnums.push(field);
                return;
            }
            if (type.item.type === "string" || type.item.type === "number") {
                const isDate = "input" in type.item && type.item.input === "date";
                orderByEnums.push(field);
                values.push({
                    in: "query",
                    name: `data.${prefix + field}`,
                    style: "deepObject",
                    explode: true,
                    schema: criteria[isComparable(type.item) ? (isDate ? "date" : "number") : "string"],
                    example: "{}",
                    description: (type.item.type === "number"
                        ? 'Query example: <tt>{"lte": 42}</tt>'
                        : 'Query example: <tt>{"eq": "some value"}</tt>') +
                        ' or <tt>{"eq": "null"}</tt>'
                });
                return;
            }
            if (type.item.type === "boolean") {
                values.push({
                    in: "query",
                    name: `data.${prefix + field}[eq]`,
                    schema: {
                        type: "string",
                        enum: ["true", "false"]
                    }
                });
                return;
            }
            return;
        }
        if (type.type === "object" && type.fields) {
            const sub = describeModel(type, prefix + field + ".", uniqueFields);
            values = [...values, ...sub.values];
            orderByEnums = [...orderByEnums, ...sub.orderByEnums];
            return;
        }
        if (type.type === "content") {
            values.push({
                in: "query",
                name: `data.${prefix + field}`,
                style: "deepObject",
                explode: true,
                schema: criteria.content,
                example: "{}",
                description: ("allowAbsoluteRefs" in type && type.allowAbsoluteRefs
                    ? 'Query example: <tt>{"eq": "id"}</tt>, <tt>{"eq": "http://xx.xx"}</tt>'
                    : 'Query example: <tt>{"eq": "id"}</tt>') +
                    ', <tt>{"eq": "null"}</tt> or <tt>{"eq":"string“, "path":"field1.field2"}</tt>'
            });
        }
        if (type.type === "references") {
            values.push({
                in: "query",
                name: `data.${prefix + field}`,
                style: "deepObject",
                explode: true,
                schema: criteria.content,
                example: "{}",
                description: 'Query example: <tt>{"eq": "id"}</tt>, <tt>{"eq": "null"}</tt> or <tt>{"eq":"string“, "path":"field1.field2"}</tt>'
            });
        }
        if (!("index" in type) && !uniqueFields.includes(prefix + field)) {
            return;
        }
        if (type.type === "position") {
            orderByEnums.push(field);
            return;
        }
        if (type.type === "string" ||
            type.type === "number" ||
            (type.type === "immutable" &&
                (type.child.type === "string" || type.child.type === "number"))) {
            const t = type.type === "immutable" ? type.child : type;
            const isDate = "input" in type && type.input === "date";
            orderByEnums.push(field);
            values.push({
                in: "query",
                name: `data.${prefix + field}`,
                style: "deepObject",
                explode: true,
                schema: criteria[isComparable(t) ? (isDate ? "date" : "number") : "string"],
                example: "{}",
                description: type.type === "number"
                    ? 'Query example: <tt>{"lte": 42}</tt>'
                    : 'Query example: <tt>{"eq": "some value"}</tt>'
            });
            return;
        }
        if (type.type === "boolean" ||
            (type.type === "immutable" && type.child.type === "boolean")) {
            values.push({
                in: "query",
                name: `data.${prefix + field}[eq]`,
                schema: {
                    type: "string",
                    enum: ["true", "false"]
                }
            });
            return;
        }
        return;
    });
    return { values, orderByEnums };
};
const criteria = {
    date: object({
        eq: { oneOf: [float, string] },
        ne: { oneOf: [float, string] },
        gt: { oneOf: [float, string] },
        gte: { oneOf: [float, string] },
        lt: { oneOf: [float, string] },
        lte: { oneOf: [float, string] }
    }),
    number: object({
        eq: { oneOf: [float, array(float)] },
        ne: { oneOf: [float, array(float)] },
        gt: float,
        gte: float,
        lt: float,
        lte: float
    }),
    string: object({
        eq: { oneOf: [string, array(string)] },
        ne: { oneOf: [string, array(string)] }
    }),
    content: object({
        eq: { oneOf: [float, string, array({ oneOf: [float, string] })] },
        ne: { oneOf: [float, string, array({ oneOf: [float, string] })] },
        gt: { oneOf: [float, string] },
        gte: { oneOf: [float, string] },
        lt: { oneOf: [float, string] },
        lte: { oneOf: [float, string] },
        path: string
    })
};
const idParam = param("id", { schema: string });
const defaultQueryParams = [
    { name: "offset", in: "query", schema: integer, default: 0 },
    { name: "limit", in: "query", schema: integer, default: 50 }
];
function createQueryParams(model) {
    let params = [];
    if (model.collection !== "singleton") {
        params = [
            {
                name: "order",
                in: "query",
                schema: {
                    type: "string",
                    enum: ["asc", "desc"]
                }
            },
            ...defaultQueryParams
        ];
        const { values, orderByEnums } = describeModel(model);
        params = [...params, ...values];
        if (orderByEnums.length) {
            params.unshift({
                name: "orderBy",
                in: "query",
                schema: {
                    type: "string",
                    enum: orderByEnums
                }
            });
        }
    }
    return params;
}
function createFieldsParams(model) {
    return {
        name: "fields",
        in: "query",
        style: "deepObject",
        description: "Select fields to be included in response.",
        explode: true,
        schema: array({
            type: "string",
            enum: Object.keys(model.fields)
        })
    };
}
function createJoinParams(model, { content: models }) {
    const params = [];
    let refs = [];
    visitModel(model, (key, field) => {
        if (field.type === "content") {
            if ("models" in field && field.models && field.models.length) {
                field.models.forEach(n => {
                    refs.push(n);
                });
            }
            else if (field.model) {
                refs.push(field.model);
            }
        }
        if (field.type === "references") {
            if (field.model) {
                refs.push(field.model);
            }
        }
    });
    refs = [...new Set(refs)];
    refs.forEach((modelName) => {
        const m = models.find(c => c.name === modelName);
        if (!m || !Object.keys(m.fields).length)
            return;
        const schema = {
            type: "string",
            enum: Object.keys(m.fields)
        };
        params.push({
            in: "query",
            name: `join[${toTypeName(modelName)}]`,
            style: "deepObject",
            explode: true,
            schema: array(schema)
        });
    });
    return { params, refs };
}
export default (api, models) => {
    const searchableModels = searchableModelNames(models.content);
    const mediaType = addExternalModel(api, models.media);
    const includeModels = {
        name: "includeModels",
        in: "query",
        style: "deepObject",
        description: "Select models to be included in search.",
        explode: true,
        schema: array({
            type: "string",
            enum: searchableModels
        })
    };
    const searchParams = [
        {
            name: "term",
            in: "query",
            required: true,
            schema: {
                type: "string"
            }
        },
        includeModels,
        Object.assign(Object.assign({}, includeModels), { name: "excludeModels", description: "Select models to be excluded from search." }),
        {
            name: "linkableOnly",
            in: "query",
            schema: {
                type: "boolean",
                default: true
            }
        }
    ];
    api.addPath(`/search/content`, {
        /** List contents */
        get: {
            summary: `Search contents`,
            operationId: `listContentBySearch`,
            tags: ["Suche"],
            parameters: [...searchParams, ...defaultQueryParams],
            responses: {
                "200": {
                    description: "Content List",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["total", "items", "_refs"],
                                properties: {
                                    total: integer,
                                    items: array({
                                        type: "object",
                                        properties: {
                                            id: string,
                                            title: string,
                                            description: string,
                                            image: media,
                                            url: string
                                        },
                                        required: ["id", "title"]
                                    }),
                                    _refs: refsSchema(mediaType)
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    /** List search suggestions */
    api.addPath(`/search/suggest`, {
        get: {
            summary: `Suggest search terms`,
            operationId: `listSearchSuggestions`,
            tags: ["Suchvorschläge"],
            parameters: searchParams,
            responses: {
                "200": {
                    description: "Content List",
                    content: {
                        "application/json": {
                            schema: array(string)
                        }
                    }
                }
            }
        }
    });
    // Add models schemas
    const refs = {};
    models.content.forEach(model => {
        if (model.collection === "iframe") {
            // Ignore iframe models & noFeed Models
            return;
        }
        refs[`${model.name}`] = addExternalModel(api, model);
    });
    // Add routes for models
    models.content.forEach(model => {
        const { name, singular, plural, collection } = model;
        const singularName = toTypeName(name);
        const pluralName = toTypeName(pluralize(name));
        const singleton = collection === "singleton";
        const tags = [plural];
        if (collection === "iframe" || model.noFeed) {
            // Ignore iframe models & noFeed Models
            return;
        }
        const { params: commonParams, refs: joinRefs } = createJoinParams(model, models);
        if (hasType(model, "richtext")) {
            commonParams.push({
                name: "X-Richtext-Format",
                in: "header",
                schema: {
                    type: "string",
                    enum: formats
                }
            });
        }
        const Type = refs[`${model.name}`];
        const RefsSchema = refsSchema(mediaType);
        joinRefs.forEach(modelName => {
            RefsSchema.properties.content.properties[modelName] = {
                type: "object",
                additionalProperties: refs[modelName]
            };
        });
        api.addPath(`/${name}`, {
            /** List contents */
            get: {
                summary: singleton ? `Load ${singularName}` : `List ${pluralName}`,
                operationId: singleton ? `load_${singularName}` : `list_${pluralName}`,
                tags,
                parameters: [
                    ...createQueryParams(model),
                    createFieldsParams(model),
                    ...commonParams,
                    listSearchParams
                ],
                responses: {
                    "200": {
                        description: singleton
                            ? `Load ${toTypeName(name)}`
                            : `List of ${plural}`,
                        content: {
                            "application/json": {
                                schema: singleton
                                    ? {
                                        allOf: [
                                            Type,
                                            {
                                                type: "object",
                                                properties: {
                                                    _id: { type: "string" },
                                                    _refs: RefsSchema
                                                }
                                            }
                                        ],
                                        required: ["_id", "_refs"]
                                    }
                                    : {
                                        type: "object",
                                        properties: {
                                            total: integer,
                                            items: array({
                                                allOf: [
                                                    Type,
                                                    {
                                                        type: "object",
                                                        properties: { _id: { type: "string" } },
                                                        required: ["_id"]
                                                    }
                                                ]
                                            }),
                                            _refs: RefsSchema
                                        },
                                        required: ["total", "items", "_refs"]
                                    }
                            }
                        }
                    }
                }
            }
        });
        if (!singleton) {
            const get = {
                summary: `Load ${singularName}`,
                operationId: `load_${singularName}`,
                tags,
                parameters: [idParam, createFieldsParams(model)].concat(commonParams),
                responses: {
                    "200": {
                        description: `${singular} found`,
                        content: {
                            "application/json": {
                                schema: {
                                    allOf: [
                                        Type,
                                        {
                                            type: "object",
                                            properties: {
                                                _id: { type: "string" },
                                                _refs: RefsSchema
                                            }
                                        }
                                    ],
                                    required: ["_id", "_refs"]
                                }
                            }
                        }
                    },
                    "404": ref("responses/notFound")
                }
            };
            api.addPath(`/${name}/{id}`, {
                /** Find content by id */
                get
            });
            // LoadContentByUniqueField
            if (model.uniqueFields) {
                model.uniqueFields.forEach(uniqueField => {
                    api.addPath(`/${name}/${uniqueField}/{uniqueValue}`, {
                        /** Find content by unique field value */
                        get: Object.assign(Object.assign({}, get), { parameters: [
                                param("uniqueValue", { schema: string }),
                                createFieldsParams(model)
                            ].concat(commonParams), operationId: `load_${singularName}_by_${uniqueField}` })
                    });
                });
            }
        }
    });
};
//# sourceMappingURL=describe.js.map