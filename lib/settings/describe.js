"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oapi_1 = require("../api/oapi");
const tags = ["Settings"];
const produces = ["application/json"];
/**
 * Adds all settings-related routes (defined in ./routes.ts) to an OpenAPI spec.
 */
function default_1(api, model) {
    const { name, singular, plural } = model;
    const Type = (0, oapi_1.addModel)(api, model);
    api.addPath(`/admin/rest/settings/${name}`, {
        /** List */
        get: {
            summary: `List ${plural}`,
            operationId: `get${name}List`,
            tags,
            produces,
            responses: {
                "200": {
                    description: `List ${plural}`,
                    schema: (0, oapi_1.array)(oapi_1.object.required("id", "title")({
                        total: oapi_1.integer,
                        data: (0, oapi_1.array)((0, oapi_1.object)({
                            id: oapi_1.string,
                            title: oapi_1.string,
                            image: oapi_1.string
                        }))
                    }))
                }
            }
        },
        /** Create */
        post: {
            summary: `Create ${singular}`,
            operationId: `create${name}`,
            tags,
            produces,
            responses: {
                "200": {
                    description: `${singular} created`,
                    schema: Type
                }
            }
        }
    });
    api.addPath(`/admin/rest/settings/${name}/{id}`, {
        /** Load */
        get: {
            summary: `Find ${singular} by id`,
            operationId: `find${name}ById`,
            tags,
            produces,
            parameters: [(0, oapi_1.param)("id", { schema: oapi_1.integer })],
            responses: {
                "200": {
                    description: `${singular} found`,
                    schema: Type
                },
                "400": oapi_1.ref.response("notFound")
            }
        },
        /** Update content */
        put: {
            summary: `Update ${singular}`,
            operationId: `update${name}`,
            tags,
            produces,
            parameters: [(0, oapi_1.param)("id", { schema: oapi_1.integer })],
            responses: {
                "200": {
                    description: `${singular} updated`,
                    schema: Type
                },
                "400": oapi_1.ref.response("notFound")
            }
        },
        /** Delete */
        delete: {
            summary: `Delete ${singular}`,
            operationId: `delete${name}`,
            tags,
            produces,
            parameters: [(0, oapi_1.param)("id", { schema: oapi_1.integer })],
            responses: {
                "204": {
                    description: `${singular} deleted`
                },
                "400": oapi_1.ref.response("notFound")
            }
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=describe.js.map