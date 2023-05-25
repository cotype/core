import { OpenApiBuilder } from "openapi3-ts";
import urlJoin from "url-join";
export default function getApiBuilder(basePath) {
    const apiBuilder = OpenApiBuilder.create()
        .addServer({
        url: urlJoin(basePath, "rest/drafts"),
        description: "Drafted Contents"
    })
        .addServer({
        url: urlJoin(basePath, "rest/published"),
        description: "Published Contents"
    })
        .addResponse("notFound", {
        description: "Not found"
    });
    // Hide authorize button as we currently have no schemes
    // See: https://github.com/swagger-api/swagger-ui/issues/3314
    delete apiBuilder.rootDoc.components.securitySchemes;
    return apiBuilder;
}
//# sourceMappingURL=getApiBuilder.js.map