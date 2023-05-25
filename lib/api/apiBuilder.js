/**
 * Empty OpenAPI spec that gets populated by the various describe.ts modules.
 */
import { OpenApiBuilder } from "openapi3-ts";
const apiBuilder = OpenApiBuilder.create().addResponse("notFound", {
    description: "Not found"
});
// Hide authorize button as we currently have no schemes
// See: https://github.com/swagger-api/swagger-ui/issues/3314
delete apiBuilder.rootDoc.components.securitySchemes;
export default apiBuilder;
//# sourceMappingURL=apiBuilder.js.map