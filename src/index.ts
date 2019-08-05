/// <reference path="../typings/untyped-modules.d.ts"/>
/// <reference path="../typings/request.d.ts"/>

import {
  ModelOpts,
  NavigationOpts,
  ThumbnailProvider,
  ContentHooks,
  ResponseHeaders,
  ExternalDataSource
} from "../typings";
import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  Express
} from "express";
import promiseRouter from "express-promise-router";
import * as path from "path";
import urlJoin from "url-join";
import * as fs from "fs-extra";
import log from "./log";
import session from "./session";

import buildModels from "./model";
import filterModels, { createModelFilter } from "./model/filterModels";

import { buildInfo } from "./model/navigationBuilder";

import createPersistence from "./persistence";

import icons from "./icons";

import Auth, { AnonymousPermissions } from "./auth";
import withAuth from "./auth/withAuth";
import Content, { getRestApiBuilder as createRestApiBuilder } from "./content";
import Settings from "./settings";
import Media from "./media";

import apiBuilder from "./api/apiBuilder";
import swaggerUi from "./api/swaggerUi";
import HttpError from "./HttpError";
import { PersistenceAdapter } from "./persistence/adapter";
import ContentPersistence from "./persistence/ContentPersistence";
import Storage from "./media/storage/Storage";
import logResponseTime from "./responseTimeLogger";
import MigrationContext from "./persistence/MigrationContext";

type SessionOpts = CookieSessionInterfaces.CookieSessionOptions;

export { Persistence } from "./persistence";
export { default as knexAdapter } from "./persistence/adapter/knex";
export * from "../typings";
export { default as FsStorage } from "./media/storage/FsStorage";

export * from "./utils";
export {
  PersistenceAdapter,
  Storage,
  SessionOpts,
  RequestHandler,
  AnonymousPermissions,
  ContentPersistence,
  MigrationContext,
  log
};

export type Opts = {
  models: ModelOpts[];
  navigation?: NavigationOpts[];
  storage: Storage;
  basePath?: string;
  mediaUrl?: string;
  persistenceAdapter: Promise<PersistenceAdapter>;
  externalDataSources?: ExternalDataSource[];
  sessionOpts?: SessionOpts;
  responseHeaders?: ResponseHeaders;
  thumbnailProvider: ThumbnailProvider;
  clientMiddleware?: RequestHandler | RequestHandler[];
  anonymousPermissions?: AnonymousPermissions;
  customSetup?: (app: Express, contentPersistence: ContentPersistence) => void;
  contentHooks?: ContentHooks;
  migrationDir?: string;
};

const root = path.resolve(__dirname, "../dist/client");
let index: string;

function getIndexHtml(basePath: string) {
  if (!index) index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  return index.replace(/"src\./g, `"${basePath}/static/src.`);
}
export const clientMiddleware = promiseRouter()
  .use(
    "/admin",
    express.static(root, {
      maxAge: "1y", // cache all static resources for a year ...
      immutable: true, // which is fine, as all resource URLs contain a hash
      index: false // index.html will be served by the fallback middleware
    }),
    (_: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      next();
    }
  )
  .use("/admin", (req, res, next) => {
    if (
      (req.method === "GET" || req.method === "HEAD") &&
      req.accepts("html")
    ) {
      const basePath = req.originalUrl.replace(/^(.*\/admin).*/, "$1");
      res.send(getIndexHtml(basePath));
    } else next();
  });

function getModels(opts: Pick<Opts, "externalDataSources" | "models">) {
  const externalDataSources = (opts.externalDataSources || []).map(withAuth);
  return {
    models: buildModels(opts.models, externalDataSources),
    externalDataSources
  };
}

export async function getRestApiBuilder(
  opts: Pick<Opts, "models" | "basePath" | "externalDataSources">
) {
  const { basePath = "" } = opts;
  const { models } = getModels(opts);

  return createRestApiBuilder(models, basePath);
}

export async function init(opts: Opts) {
  const { models, externalDataSources } = getModels(opts);
  const {
    basePath = "",
    mediaUrl = "/media",
    storage,
    thumbnailProvider,
    responseHeaders,
    contentHooks,
    migrationDir
  } = opts;

  const persistence = await createPersistence(
    models,
    await opts.persistenceAdapter,
    {
      basePath,
      mediaUrl,
      contentHooks,
      migrationDir
    }
  );
  const auth = Auth(persistence, opts.anonymousPermissions);
  const content = Content({
    persistence,
    models,
    externalDataSources,
    basePath,
    mediaUrl,
    responseHeaders
  });
  const settings = Settings(persistence, models);
  const media = Media(persistence, models, storage, thumbnailProvider);

  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(session(opts.sessionOpts));
  if (process.env.PERFORMANCE_LOGGING === "true") {
    app.use(logResponseTime);
  }
  app.all("/status", (req, res) => {
    res.json({
      uptime: process.uptime(),
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      pid: process.pid
    });
  });

  const router = promiseRouter();
  app.use(basePath.replace(/\/$/, ""), router);

  auth.routes(router); // login, principal, logout
  media.routes(router); // static, thumbs
  settings.routes(router); // admin/rest/settings
  icons.routes(router); // icons

  router.get("/admin/rest/info", async (req, res) => {
    if (!req.principal || !req.principal.id) return res.json({});

    const filteredModels = filterModels(models, req.principal);
    const filter = createModelFilter(req.principal);
    const filteredInfo = buildInfo(opts.navigation || [], models, filter);

    res.json({
      ...filteredInfo,
      models: filteredModels,
      baseUrls: {
        media: mediaUrl,
        cms: basePath
      },
      user: req.principal
    });
  });

  router.get("/admin/rest/info/content", (req, res) => {
    const filteredModels = filterModels(models, req.principal);
    res.json(filteredModels.content.map(m => m.name));
  });

  router.get("/admin/rest/info/settings", (req, res) => {
    const filteredModels = filterModels(models, req.principal);
    res.json(filteredModels.settings.map(m => m.name));
  });

  auth.describe(apiBuilder);
  media.describe(apiBuilder);
  content.describe(apiBuilder);
  settings.describe(apiBuilder);

  router.get("/admin/rest/swagger.json", (req, res) => {
    res.json(apiBuilder.getSpec());
  });

  router.use(
    "/admin/rest/docs",
    swaggerUi(
      urlJoin(basePath, "admin/rest/docs/"),
      urlJoin(basePath, "admin/rest/swagger.json")
    )
  );
  router.get("/admin/rest", (req, res) =>
    res.redirect(urlJoin(basePath, "admin/rest/docs"))
  );

  content.routes(router);

  router.use(opts.clientMiddleware || clientMiddleware);

  if (opts.customSetup) {
    opts.customSetup(app, persistence.content);
  }

  app.get(basePath, (_, res) => res.redirect(urlJoin(basePath, "admin")));

  app.use((err: Error, req: Request, res: Response, _: () => void) => {
    if (err instanceof HttpError) {
      res.status(err.status);
    } else {
      log.error(req.method, req.path, err);
      res.status(500);
    }
    res.end(err.message);
    return;
  });

  return { app, persistence };
}
