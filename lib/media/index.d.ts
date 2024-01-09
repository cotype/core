import { Models, ThumbnailProvider } from "../../typings";
import { Router } from "express";
import { OpenApiBuilder } from "openapi3-ts";
import { Persistence } from "../persistence";
import Storage from "./storage/Storage";
export default function media(persistence: Persistence, models: Models, storage: Storage, thumbnailProvider: ThumbnailProvider, basePath?: string): {
    describe(api: OpenApiBuilder): void;
    routes(router: Router): void;
};
