import { OpenApiBuilder } from "openapi3-ts";

const apiBuilder = OpenApiBuilder.create()
  .addServer({
    url: "/rest/drafts",
    description: "Drafted Contents"
  })
  .addServer({
    url: "/rest/published",
    description: "Published Contents"
  })
  .addResponse("notFound", {
    description: "Not found"
  });

// Hide authorize button as we currently have no schemes
// See: https://github.com/swagger-api/swagger-ui/issues/3314
delete apiBuilder.rootDoc.components!.securitySchemes;

export default apiBuilder;
