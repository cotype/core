import { addModel, ref, array, object, integer, string, param } from "../api/oapi";
const tags = ["Settings"];
const produces = ["application/json"];
/**
 * Adds all settings-related routes (defined in ./routes.ts) to an OpenAPI spec.
 */
export default function (api, model) {
    const { name, singular, plural } = model;
    const Type = addModel(api, model);
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
                    schema: array(object.required("id", "title")({
                        total: integer,
                        data: array(object({
                            id: string,
                            title: string,
                            image: string
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
            parameters: [param("id", { schema: integer })],
            responses: {
                "200": {
                    description: `${singular} found`,
                    schema: Type
                },
                "400": ref.response("notFound")
            }
        },
        /** Update content */
        put: {
            summary: `Update ${singular}`,
            operationId: `update${name}`,
            tags,
            produces,
            parameters: [param("id", { schema: integer })],
            responses: {
                "200": {
                    description: `${singular} updated`,
                    schema: Type
                },
                "400": ref.response("notFound")
            }
        },
        /** Delete */
        delete: {
            summary: `Delete ${singular}`,
            operationId: `delete${name}`,
            tags,
            produces,
            parameters: [param("id", { schema: integer })],
            responses: {
                "204": {
                    description: `${singular} deleted`
                },
                "400": ref.response("notFound")
            }
        }
    });
}
//# sourceMappingURL=describe.js.map