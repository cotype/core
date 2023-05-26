"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oapi_1 = require("../api/oapi");
const describe_1 = require("./rest/describe");
const tags = ["Content"];
const produces = ["application/json"];
/**
 * Adds all content-related routes (defined in ./routes.ts) to an OpenAPI spec.
 * NOTE: This does not include the read-only routes of the public REST api.
 */
exports.default = (api) => {
    api.addSchema("Version", (0, oapi_1.object)({
        type: oapi_1.string,
        id: oapi_1.integer,
        date: oapi_1.string,
        published: oapi_1.boolean,
        author: oapi_1.string
    }));
    const Version = oapi_1.ref.schema("Version");
    api.addPath("/admin/rest/content", {
        /** List content types */
        get: {
            summary: "List content types",
            operationId: "listContentTypes",
            tags,
            produces,
            responses: {
                "200": {
                    description: "Content types",
                    schema: (0, oapi_1.array)(oapi_1.string)
                }
            }
        }
    });
    api.addPath("/admin/rest/content/{type}", {
        /** List contents */
        get: {
            summary: "List contents of the give type",
            operationId: "listContents",
            parameters: [(0, oapi_1.param)("type", { schema: oapi_1.string }), describe_1.listSearchParams],
            tags,
            produces,
            responses: {
                "200": {
                    description: "Content List",
                    schema: (0, oapi_1.array)({
                        type: "object",
                        required: ["id", "title"],
                        properties: {
                            total: oapi_1.integer,
                            items: (0, oapi_1.array)({
                                type: "object",
                                properties: {
                                    id: oapi_1.string,
                                    title: oapi_1.string,
                                    image: oapi_1.string
                                }
                            })
                        }
                    })
                }
            }
        },
        /** Create new content */
        post: {
            summary: "Create content",
            operationId: "createContent",
            parameters: [(0, oapi_1.param)("type", { schema: oapi_1.string })],
            tags,
            produces,
            responses: {
                "200": {
                    description: "Content created",
                    schema: oapi_1.empty
                }
            }
        }
    });
    api.addPath("/admin/rest/content/{type}/{id}", {
        /** Find content by id */
        get: {
            summary: "Find content by id",
            operationId: "findContentById",
            tags,
            produces,
            parameters: [
                (0, oapi_1.param)("type", { schema: oapi_1.string }),
                (0, oapi_1.param)("id", { schema: oapi_1.integer })
            ],
            responses: {
                "200": {
                    description: "Content found",
                    schema: oapi_1.empty
                },
                "400": oapi_1.ref.response("notFound")
            }
        },
        /** Publish/Unpublish or change position */
        put: {
            summary: "Update content",
            operationId: "updateContent",
            tags,
            produces,
            parameters: [
                (0, oapi_1.param)("type", { schema: oapi_1.string }),
                (0, oapi_1.param)("id", { schema: oapi_1.integer })
            ],
            requestBody: (0, oapi_1.body)({
                published: oapi_1.boolean
            }),
            responses: {
                "204": {
                    description: "Content updated"
                },
                "400": oapi_1.ref.response("notFound")
            }
        },
        /** Delete content */
        delete: {
            summary: "Delete content",
            operationId: "deleteContent",
            tags,
            produces,
            parameters: [
                (0, oapi_1.param)("type", { schema: oapi_1.string }),
                (0, oapi_1.param)("id", { schema: oapi_1.integer })
            ],
            responses: {
                "204": {
                    description: "Content deleted"
                },
                "400": oapi_1.ref.response("notFound")
            }
        }
    });
    api.addPath("/admin/rest/content/{type}/{id}/versions", {
        /** List all versions */
        get: {
            summary: "List content versions",
            operationId: "listContentVersions",
            parameters: [
                (0, oapi_1.param)("type", { schema: oapi_1.string }),
                (0, oapi_1.param)("id", { schema: oapi_1.integer })
            ],
            tags,
            produces,
            responses: {
                "200": {
                    description: "Version List",
                    schema: (0, oapi_1.array)(Version)
                }
            }
        },
        post: {
            summary: "Create new version",
            operationId: "createContentVersion",
            parameters: [
                (0, oapi_1.param)("type", { schema: oapi_1.string }),
                (0, oapi_1.param)("id", { schema: oapi_1.integer })
            ],
            tags,
            produces,
            responses: {
                "200": {
                    description: "Version created",
                    schema: oapi_1.empty
                }
            }
        }
    });
    api.addPath("/admin/rest/content/{type}/{id}/versions/{rev}", {
        get: {
            summary: "Get a specific content version",
            operationId: "getContentVersion",
            tags,
            produces,
            parameters: [
                (0, oapi_1.param)("type", { schema: oapi_1.string }),
                (0, oapi_1.param)("id", { schema: oapi_1.integer }),
                (0, oapi_1.param)("rev", { schema: oapi_1.integer })
            ],
            responses: {
                "200": {
                    description: "Content version found",
                    schema: oapi_1.empty
                },
                "400": oapi_1.ref.response("notFound")
            }
        }
    });
};
//# sourceMappingURL=describe.js.map