/// <reference path="../typings/untyped-modules.d.ts"/>
/// <reference path="../typings/request.d.ts"/>

import {
  ModelOpts,
  NavigationOpts,
  ThumbnailProvider,
  BaseUrls,
  ContentHooks
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
import * as fs from "fs-extra";
import session from "./session";

import buildModels from "./model";
import filterModels, { createModelFilter } from "./model/filterModels";

import { buildInfo } from "./model/navigationBuilder";

import persistence from "./persistence";

import icons from "./icons";

import Auth, { AnonymousPermissions } from "./auth";
import withAuth from "./auth/withAuth";
import Content from "./content";
import Settings from "./settings";
import Media from "./media";

import apiBuilder from "./api/apiBuilder";
import swaggerUi from "./api/swaggerUi";
import HttpError from "./HttpError";
import { PersistenceAdapter } from "./persistence/adapter";
import {
  provide as provideExternalDataSourceHelper,
  ExternalDataSourceWithOptionalHelper
} from "./externalDataSourceHelper";
import ContentPersistence from "./persistence/ContentPersistence";
import Storage from "./media/storage/Storage";

export { Persistence } from "./persistence";
export { default as knexAdapter } from "./persistence/adapter/knex";
export * from "../typings";
export {
  formats as thumbnailFormats
} from "./media/thumbnails/ThumbnailProvider";
export { default as FsStorage } from "./media/storage/FsStorage";

export * from "./utils";

export type Opts = {
  models: ModelOpts[];
  navigation?: NavigationOpts[];
  storage: Storage;
  baseUrls?: BaseUrls;
  basePath?: string;
  persistenceAdapter: Promise<PersistenceAdapter>;
  externalDataSources?: ExternalDataSourceWithOptionalHelper[];
  sessionOpts?: CookieSessionInterfaces.CookieSessionOptions;
  customThumbnailProvider?: ThumbnailProvider;
  clientMiddleware?: RequestHandler | RequestHandler[];
  anonymousPermissions?: AnonymousPermissions;
  customSetup?: (app: Express, contentPersistence: ContentPersistence) => void;
  contentHooks?: ContentHooks;
};

const root = path.resolve(__dirname, "../dist/client");
let index: string;

function getIndexHtml(basePath: string) {
  if (!index) index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  return index.replace(/"src\./g, `"${basePath}/static/src.`);
}

export const clientMiddleware = promiseRouter()
  .use(
    "/static",
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
  .use((req, res, next) => {
    if (
      (req.method === "GET" || req.method === "HEAD") &&
      req.accepts("html")
    ) {
      const basePath = req.originalUrl.replace(/^(.*\/admin).*/, "$1");
      res.send(getIndexHtml(basePath));
    } else next();
  });

export async function init(opts: Opts) {
  const externalDataSources = provideExternalDataSourceHelper(
    opts.externalDataSources,
    {
      baseUrls: opts.baseUrls || {}
    }
  ).map(withAuth);
  const models = buildModels(opts.models, externalDataSources);
  const p = await persistence(models, await opts.persistenceAdapter, {
    baseUrls: opts.baseUrls,
    contentHooks: opts.contentHooks
  });
  const auth = Auth(p, opts.anonymousPermissions);
  const content = Content(p, models, externalDataSources, opts.baseUrls || {});
  const settings = Settings(p, models);
  const media = Media(p, models, opts.storage, opts.customThumbnailProvider);

  const basePath = opts.basePath || "";
  const adminPath = `${basePath}/admin`;

  const app = express();

  app.use(express.json());
  app.use(session(opts.sessionOpts));

  app.all("/status", (req, res) => {
    res.json({
      uptime: process.uptime(),
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      pid: process.pid
    });
  });

  const router = promiseRouter();
  app.use(basePath, router);

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
        preview: opts.baseUrls ? opts.baseUrls.preview : undefined
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

  router.use("/admin/rest/docs", swaggerUi("/admin/rest/swagger.json"));
  router.get("/admin/rest", (req, res) => res.redirect("/admin/rest/docs/"));

  if (process.env.NODE_ENV === "test" && p.adapter.reset) {
    router.post("/admin/__reset", async (req, res) => {
      await p.adapter.reset!(req.body);
      await p.init(models);
      res.end();
    });
  }

  content.routes(router);

  router.use("/admin", opts.clientMiddleware || clientMiddleware);

  if (opts.customSetup) {
    opts.customSetup(app, p.content);
  }

  app.get(basePath, (req, res) => res.redirect(adminPath));

  app.use((err: Error, req: Request, res: Response, _: () => void) => {
    if (err instanceof HttpError) {
      res.status(err.status);
    } else {
      console.error(req.method, req.path, err);
      res.status(500);
    }
    res.end(err.message);
    return;
  });

  return { app, persistence: p };
}
