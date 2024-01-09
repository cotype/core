import { Models, ExternalDataSource, ResponseHeaders } from "../../../typings";
import { OpenApiBuilder } from "openapi3-ts";
import { Router } from "express";
import { Persistence } from "../../persistence";
export declare function getApiBuilder(models: Models, basePath: string): OpenApiBuilder;
type Opts = {
    persistence: Persistence;
    models: Models;
    externalDataSources: ExternalDataSource[];
    basePath: string;
    mediaUrl: string;
    responseHeaders?: ResponseHeaders;
};
export default function rest(router: Router, { persistence, models, externalDataSources, basePath, mediaUrl, responseHeaders }: Opts): void;
export {};
