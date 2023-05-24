"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oapi_1 = require("../api/oapi");
const tags = ["Media"];
const produces = ["application/json"];
const criteria = {
    number: (0, oapi_1.object)({
        eq: oapi_1.float,
        ne: oapi_1.float,
        gt: oapi_1.float,
        gte: oapi_1.float,
        lt: oapi_1.float,
        lte: oapi_1.float
    }),
    string: (0, oapi_1.object)({
        eq: oapi_1.string,
        ne: oapi_1.string
    })
};
/**
 * Adds all media-related routes (defined in ./routes.ts) to an OpenAPI spec.
 */
exports.default = (api, media) => {
    const mediaRef = (0, oapi_1.addModel)(api, media);
    api.addPath("/admin/rest/upload", {
        post: {
            summary: "Upload a media file",
            tags,
            produces,
            responses: {
                "200": {
                    description: "Meta data",
                    schema: mediaRef
                }
            }
        }
    });
    api.addPath("/admin/rest/media", {
        get: {
            summary: "List of media assets",
            operationId: "listMedia",
            tags,
            produces,
            parameters: [
                {
                    in: "query",
                    name: `mimetype`,
                    style: "deepObject",
                    explode: true,
                    schema: criteria.number,
                    example: "{}",
                    description: 'Query example: <tt>{"like": "image"}</tt>'
                },
                {
                    in: "query",
                    name: `size`,
                    style: "deepObject",
                    explode: true,
                    schema: criteria.number,
                    example: "{}",
                    description: 'Query example: <tt>{"lte": 42}</tt>'
                },
                {
                    name: "orderBy",
                    in: "query",
                    schema: oapi_1.string,
                    default: "created_at"
                },
                {
                    name: "order",
                    in: "query",
                    schema: oapi_1.string,
                    default: "desc"
                },
                { name: "offset", in: "query", schema: oapi_1.integer, default: 0 },
                { name: "limit", in: "query", schema: oapi_1.integer, default: 50 }
            ],
            responses: {
                "200": {
                    description: "List of media assets",
                    schema: (0, oapi_1.array)(mediaRef)
                },
                "400": oapi_1.ref.response("notFound")
            }
        }
    });
    api.addPath("/admin/rest/media/{id}", {
        get: {
            summary: "Details for a single media asset",
            operationId: "getMedia",
            tags,
            produces,
            parameters: [(0, oapi_1.param)("id", { schema: oapi_1.string })],
            responses: {
                "200": {
                    description: "Media details",
                    schema: mediaRef
                },
                "400": oapi_1.ref.response("notFound")
            }
        }
    });
};
//# sourceMappingURL=describe.js.map