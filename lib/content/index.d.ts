import { Router } from "express";
import { ResponseHeaders, ExternalDataSource, Models } from "../../typings";
import { Persistence } from "../persistence";
import { getApiBuilder as getRestApiBuilder } from "./rest";
export { getRestApiBuilder };
type Opts = {
    persistence: Persistence;
    models: Models;
    externalDataSources: ExternalDataSource[];
    basePath: string;
    mediaUrl: string;
    responseHeaders?: ResponseHeaders;
};
declare const _default: (opts: Opts) => {
    describe: (api: import("openapi3-ts").OpenApiBuilder) => void;
    routes(router: Router): void;
};
export default _default;
