import { Router } from "express";
import { AnonymousPermissions } from "./routes";
import { Persistence } from "../persistence";
import { Models } from "../../typings";
export { AnonymousPermissions };
declare const _default: (persistence: Persistence, permissions: AnonymousPermissions | undefined, models: Models) => {
    describe: (api: import("openapi3-ts").OpenApiBuilder) => void;
    routes(router: Router): void;
};
export default _default;
