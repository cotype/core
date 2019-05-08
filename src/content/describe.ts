import { OpenApiBuilder } from "openapi3-ts";
import {
  ref,
  string,
  boolean,
  integer,
  array,
  object,
  param,
  body,
  empty
} from "../api/oapi";

const tags = ["Content"];
const produces = ["application/json"];

/**
 * Adds all content-related routes (defined in ./routes.ts) to an OpenAPI spec.
 * NOTE: This does not include the read-only routes of the public REST api.
 */
export default (api: OpenApiBuilder) => {
  api.addSchema(
    "Version",
    object({
      type: string,
      id: integer,
      date: string,
      published: boolean,
      author: string
    })
  );
  const Version = ref.schema("Version");

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
          schema: array(string)
        }
      }
    }
  });

  api.addPath("/admin/rest/content/{type}", {
    /** List contents */
    get: {
      summary: "List contents of the give type",
      operationId: "listContents",
      parameters: [param("type", { schema: string })],
      tags,
      produces,
      responses: {
        "200": {
          description: "Content List",
          schema: array({
            type: "object",
            required: ["id", "title"],
            properties: {
              total: integer,
              items: array({
                type: "object",
                properties: {
                  id: string,
                  title: string,
                  image: string
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
      parameters: [param("type", { schema: string })],
      tags,
      produces,
      responses: {
        "200": {
          description: "Content created",
          schema: empty
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
        param("type", { schema: string }),
        param("id", { schema: integer })
      ],
      responses: {
        "200": {
          description: "Content found",
          schema: empty
        },
        "400": ref.response("notFound")
      }
    },

    /** Publish/Unpublish or change position */
    put: {
      summary: "Update content",
      operationId: "updateContent",
      tags,
      produces,
      parameters: [
        param("type", { schema: string }),
        param("id", { schema: integer })
      ],
      requestBody: body({
        published: boolean
      }),
      responses: {
        "204": {
          description: "Content updated"
        },
        "400": ref.response("notFound")
      }
    },

    /** Delete content */
    delete: {
      summary: "Delete content",
      operationId: "deleteContent",
      tags,
      produces,
      parameters: [
        param("type", { schema: string }),
        param("id", { schema: integer })
      ],
      responses: {
        "204": {
          description: "Content deleted"
        },
        "400": ref.response("notFound")
      }
    }
  });

  api.addPath("/admin/rest/content/{type}/{id}/versions", {
    /** List all versions */
    get: {
      summary: "List content versions",
      operationId: "listContentVersions",
      parameters: [
        param("type", { schema: string }),
        param("id", { schema: integer })
      ],
      tags,
      produces,
      responses: {
        "200": {
          description: "Version List",
          schema: array(Version)
        }
      }
    },
    post: {
      summary: "Create new version",
      operationId: "createContentVersion",
      parameters: [
        param("type", { schema: string }),
        param("id", { schema: integer })
      ],
      tags,
      produces,
      responses: {
        "200": {
          description: "Version created",
          schema: empty
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
        param("type", { schema: string }),
        param("id", { schema: integer }),
        param("rev", { schema: integer })
      ],
      responses: {
        "200": {
          description: "Content version found",
          schema: empty
        },
        "400": ref.response("notFound")
      }
    }
  });
};
