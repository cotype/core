/**
 * Adds docs for the auth routes to an OpenAPI spec.
 */
import { OpenApiBuilder } from "openapi3-ts";
import { body, string } from "../api/oapi";

const tags = ["Auth"];
const produces = ["application/json"];

export default (api: OpenApiBuilder) => {
  api.addPath("/admin/rest/login", {
    post: {
      tags,
      produces,
      requestBody: body({
        email: string,
        password: string
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
};
