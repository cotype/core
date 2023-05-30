/// <reference types="cookie-session" />
/// <reference types="untyped-modules" />
/// <reference types="request" />
import type { ModelOpts, NavigationOpts, ThumbnailProvider, ContentHooks, ResponseHeaders, ExternalDataSource, BaseUrls } from "../typings/index";
import express, { RequestHandler, Express } from "express";
import log from "./log";
import { AnonymousPermissions } from "./auth";
import { PersistenceAdapter } from "./persistence/adapter";
import ContentPersistence from "./persistence/ContentPersistence";
import Storage from "./media/storage/Storage";
import MigrationContext from "./persistence/MigrationContext";
import SettingsPersistence from "./persistence/SettingsPersistence";
type SessionOpts = CookieSessionInterfaces.CookieSessionOptions;
export { Persistence } from "./persistence";
export { default as knexAdapter } from "./persistence/adapter/knex";
export type { default as Cotype } from "../typings";
export { default as FsStorage } from "./media/storage/FsStorage";
export * from "./utils";
export { PersistenceAdapter, Storage, SessionOpts, RequestHandler, AnonymousPermissions, ContentPersistence, MigrationContext, log };
export type Opts = {
    models: ModelOpts[];
    navigation?: NavigationOpts[];
    storage: Storage;
    basePath?: BaseUrls | string;
    persistenceAdapter: Promise<PersistenceAdapter>;
    externalDataSources?: ExternalDataSource[];
    sessionOpts?: SessionOpts;
    responseHeaders?: ResponseHeaders;
    thumbnailProvider: ThumbnailProvider;
    clientMiddleware?: (basePath: string) => RequestHandler | RequestHandler[];
    anonymousPermissions?: AnonymousPermissions;
    customSetup?: (app: Express, contentPersistence: ContentPersistence, settingsPersistence: SettingsPersistence) => void;
    contentHooks?: ContentHooks;
    migrationDir?: string;
};
export declare const clientMiddleware: (basePath?: string) => express.Router | import("http-proxy-middleware").RequestHandler[];
export declare function getRestApiBuilder(opts: Pick<Opts, "models" | "basePath" | "externalDataSources">): Promise<import("openapi3-ts").OpenApiBuilder>;
export declare function init(opts: Opts): Promise<{
    app: import("express-serve-static-core").Express;
    persistence: import("./persistence").Persistence;
}>;
