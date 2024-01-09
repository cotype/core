import { OpenApiBuilder } from "openapi3-ts";
/**
 * Adds all content-related routes (defined in ./routes.ts) to an OpenAPI spec.
 * NOTE: This does not include the read-only routes of the public REST api.
 */
declare const _default: (api: OpenApiBuilder) => void;
export default _default;
