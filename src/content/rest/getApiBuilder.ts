import { BaseUrls } from "../../../typings";
import { OpenApiBuilder } from "openapi3-ts";
import { resolve } from "url";

export default function getApiBuilder(baseUrls: BaseUrls) {
  const apiBuilder = OpenApiBuilder.create()
    .addServer({
      url: resolve(baseUrls.cms || "", "rest/drafts"),
      description: "Drafted Contents"
    })
    .addServer({
      url: resolve(baseUrls.cms || "", "rest/published"),
      description: "Published Contents"
    })
    .addResponse("notFound", {
      description: "Not found"
    });

  // Hide authorize button as we currently have no schemes
  // See: https://github.com/swagger-api/swagger-ui/issues/3314
  delete apiBuilder.rootDoc.components!.securitySchemes;

  return apiBuilder;
}
