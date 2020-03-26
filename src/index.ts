/// <reference path="../typings/untyped-modules.d.ts"/>
/// <reference path="../typings/request.d.ts"/>

import {
  ModelOpts,
  NavigationOpts,
  ThumbnailProvider,
  ContentHooks,
  ResponseHeaders,
  ExternalDataSource,
  BaseUrls
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
import proxyMiddleware from "http-proxy-middleware";
import { spawn } from "child_process";
import SettingsPersistence from "./persistence/SettingsPersistence";

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
  basePath?: BaseUrls | string;
  persistenceAdapter: Promise<PersistenceAdapter>;
  externalDataSources?: ExternalDataSource[];
  sessionOpts?: SessionOpts;
  responseHeaders?: ResponseHeaders;
  thumbnailProvider: ThumbnailProvider;
  clientMiddleware?: (basePath: string) => RequestHandler | RequestHandler[];
  anonymousPermissions?: AnonymousPermissions;
  customSetup?: (
    app: Express,
    contentPersistence: ContentPersistence,
    settingsPersistence: SettingsPersistence
  ) => void;
  contentHooks?: ContentHooks;
  migrationDir?: string;
};

const root = path.resolve(__dirname, "../dist/client");
let index: string;

function getIndexHtml(basePath: string) {
  if (!index) index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  return index.replace(/\/admin\//g, `${urlJoin(basePath, "/admin")}/`);
}

const startDevServer = () => {
  process.stdout.write("Starting development server...\n");
  const child = spawn(`npm run watch`, [], {
    cwd: path.resolve(__dirname, "../client/"),
    shell: true
  });
  child.stdout.on("data", (data: Buffer) => {
    const string = data.toString();
    if (string.includes("Compiled successfully!")) {
      process.stdout.write("Development server updated!\n");
    }
    if (string.includes("Compiling...\n")) {
      process.stdout.write("Development server compiling...\n");
    }
    if (
      string.includes("Failed to compile.") ||
      string.includes("TypeScript error")
    ) {
      process.stderr.write(data);
    }
  });
  child.stderr.on("data", data => {
    process.stderr.write(data);
  });
  child.on("exit", data => {
    process.stdout.write("Stopping development server!");
    process.kill(1);
  });
  process.on("beforeExit", code => child.kill());
};

export const clientMiddleware = (basePath: string = "/") =>
  process.env.DEVCLIENT // Use Proxy to Dev Server
    ? [
        proxyMiddleware("/static", {
          target: `http://localhost:4001`,
          logLevel: "error",
          changeOrigin: true
        }),
        proxyMiddleware(urlJoin(basePath, "/admin"), {
          target: `http://localhost:4001`,
          logLevel: "error",
          changeOrigin: true,
          pathRewrite: { [`^/${basePath}/`]: "/" }
        })
      ]
    : promiseRouter()
        .use(
          urlJoin(basePath, "/admin"),
          express.static(root, {
            maxAge: "1y", // cache all static resources for a year ...
            immutable: true, // which is fine, as all resource URLs contain a hash
            index: false // index.html will be served by the fallback middleware
          }),
          (_: Request, res: Response, next: NextFunction) => {
            res.setHeader(
              "Cache-Control",
              "no-cache, no-store, must-revalidate"
            );
            next();
          }
        )
        .use(urlJoin(basePath, "/admin"), (req, res, next) => {
          if (
            (req.method === "GET" || req.method === "HEAD") &&
            req.accepts("html")
          ) {
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

const getBaseURLS = (
  basePath?: string | BaseUrls
): { cms: string; media: string; preview: string } => {
  if (!basePath) {
    return {
      cms: "/",
      media: urlJoin("/", "/media"),
      preview: "/"
    };
  }
  if (typeof basePath === "string") {
    return {
      cms: basePath,
      media: urlJoin(basePath, "/media"),
      preview: basePath
    };
  }
  return {
    cms: basePath.cms,
    media: basePath.media ? basePath.media : urlJoin(basePath.cms, "/media"),
    preview: basePath.preview || basePath.cms
  };
};

export async function getRestApiBuilder(
  opts: Pick<Opts, "models" | "basePath" | "externalDataSources">
) {
  const { basePath } = opts;
  const { models } = getModels(opts);

  return createRestApiBuilder(models, getBaseURLS(basePath).cms);
}
export async function init(opts: Opts) {
  const { models, externalDataSources } = getModels(opts);
  const {
    basePath,
    storage,
    thumbnailProvider,
    responseHeaders,
    contentHooks,
    migrationDir
  } = opts;
  const baseURLS = getBaseURLS(basePath);
  const mediaUrl = baseURLS.media;
  const persistence = await createPersistence(
    models,
    await opts.persistenceAdapter,
    {
      basePath: baseURLS.cms,
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
    basePath: baseURLS.cms,
    mediaUrl,
    responseHeaders
  });
  const settings = Settings(persistence, models);
  const media = Media(
    persistence,
    models,
    storage,
    thumbnailProvider,
    baseURLS.cms
  );

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
  app.use(baseURLS.cms.replace(/\/$/, ""), router);

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
      baseUrls: baseURLS,
      user: req.principal
    });
  });

  // This routes purpose is to provide all content options
  // for the MapInput inside the built-in roles models
  router.get("/admin/rest/info/content", (req, res) => {
    const filteredModels = filterModels(models, req.principal);
    res.json(
      filteredModels.content.map(m => ({ value: m.name, label: m.singular }))
    );
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
      urlJoin(baseURLS.cms, "admin/rest/docs/"),
      urlJoin(baseURLS.cms, "admin/rest/swagger.json")
    )
  );
  router.get("/admin/rest", (req, res) =>
    res.redirect(urlJoin(baseURLS.cms, "admin/rest/docs"))
  );

  content.routes(router);

  if (process.env.DEVCLIENT) {
    startDevServer();
  }

  app.use(
    (opts.clientMiddleware && opts.clientMiddleware(baseURLS.cms)) ||
      clientMiddleware(baseURLS.cms)
  );

  if (opts.customSetup) {
    opts.customSetup(app, persistence.content, persistence.settings);
  }

  app.get(baseURLS.cms, (_, res) =>
    res.redirect(urlJoin(baseURLS.cms, "admin"))
  );

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
