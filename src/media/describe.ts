import { Model } from "../../typings";
import { OpenApiBuilder } from "openapi3-ts";
import {
  ref,
  param,
  array,
  addModel,
  integer,
  object,
  float,
  string
} from "../api/oapi";

const tags = ["Media"];
const produces = ["application/json"];

const criteria = {
  number: object({
    eq: float,
    ne: float,
    gt: float,
    gte: float,
    lt: float,
    lte: float
  }),
  string: object({
    eq: string,
    ne: string
  })
};
/**
 * Adds all media-related routes (defined in ./routes.ts) to an OpenAPI spec.
 */
export default (api: OpenApiBuilder, media: Model) => {
  const mediaRef = addModel(api, media);

  api.addPath("/admin/rest/upload", {
    post: {
      summary: "Upload a media file",
      tags,
      produces,
      responses: {
        "200": {
          description: "Meta data",
          schema: mediaRef
        }
      }
    }
  });

  api.addPath("/admin/rest/media", {
    get: {
      summary: "List of media assets",
      operationId: "listMedia",
      tags,
      produces,
      parameters: [
        {
          in: "query",
          name: `mimetype`,
          style: "deepObject",
          explode: true,
          schema: criteria.number,
          example: "{}",
          description: 'Query example: <tt>{"like": "image"}</tt>'
        },
        {
          in: "query",
          name: `size`,
          style: "deepObject",
          explode: true,
          schema: criteria.number,
          example: "{}",
          description: 'Query example: <tt>{"lte": 42}</tt>'
        },
        {
          name: "orderBy",
          in: "query",
          schema: string,
          default: "created_at"
        },
        {
          name: "order",
          in: "query",
          schema: string,
          default: "desc"
        },
        { name: "offset", in: "query", schema: integer, default: 0 },
        { name: "limit", in: "query", schema: integer, default: 50 }
      ],
      responses: {
        "200": {
          description: "List of media assets",
          schema: array(mediaRef)
        },
        "400": ref.response("notFound")
      }
    }
  });

  api.addPath("/admin/rest/media/{id}", {
    get: {
      summary: "Details for a single media asset",
      operationId: "getMedia",
      tags,
      produces,
      parameters: [param("id", { schema: string })],
      responses: {
        "200": {
          description: "Media details",
          schema: mediaRef
        },
        "400": ref.response("notFound")
      }
    }
  });
};
