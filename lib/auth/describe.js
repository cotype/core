"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oapi_1 = require("../api/oapi");
const tags = ["Auth"];
const produces = ["application/json"];
exports.default = (api) => {
    api.addPath("/admin/rest/login", {
        post: {
            tags,
            produces,
            requestBody: (0, oapi_1.body)({
                email: oapi_1.string,
                password: oapi_1.string
            }),
            responses: {
                204: {
                    description: "Login successful"
                }
            }
        }
    });
    api.addPath("/admin/rest/logout", {
        post: {
            tags,
            produces,
            responses: {
                204: {
                    description: "Logout successful"
                }
            }
        }
    });
    api.addPath("/admin/rest/permissions/{type}", {
        get: {
            summary: `Get permissons`,
            operationId: `getPermissions`,
            tags,
            parameters: [
                {
                    name: "type",
                    in: "path",
                    description: "Name of a content model",
                    schema: {
                        type: "string"
                    }
                },
                {
                    name: "sessionID",
                    in: "query",
                    description: "You can pass sessionID by Session or by Query",
                    schema: {
                        type: "string"
                    }
                }
            ],
            responses: {
                "200": {
                    description: `Permissions`,
                    content: {
                        "application/json": {
                            schema: oapi_1.object.required("view", "edit", "publish", "forbidden")({
                                view: { type: "boolean" },
                                edit: { type: "boolean" },
                                publish: { type: "boolean" }
                            })
                        }
                    }
                }
            }
        }
    });
};
//# sourceMappingURL=describe.js.map