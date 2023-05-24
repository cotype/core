"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Empty OpenAPI spec that gets populated by the various describe.ts modules.
 */
const openapi3_ts_1 = require("openapi3-ts");
const apiBuilder = openapi3_ts_1.OpenApiBuilder.create().addResponse("notFound", {
    description: "Not found"
});
// Hide authorize button as we currently have no schemes
// See: https://github.com/swagger-api/swagger-ui/issues/3314
delete apiBuilder.rootDoc.components.securitySchemes;
exports.default = apiBuilder;
//# sourceMappingURL=apiBuilder.js.map