"use strict";
/// <reference path="../typings/untyped-modules.d.ts"/>
/// <reference path="../typings/request.d.ts"/>
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.getRestApiBuilder = exports.clientMiddleware = exports.log = exports.MigrationContext = exports.ContentPersistence = exports.FsStorage = exports.knexAdapter = exports.Persistence = void 0;
const express_1 = __importDefault(require("express"));
const express_promise_router_1 = __importDefault(require("express-promise-router"));
const path = __importStar(require("path"));
const url_join_1 = __importDefault(require("url-join"));
const fs = __importStar(require("fs-extra"));
const log_1 = __importDefault(require("./log"));
exports.log = log_1.default;
const session_1 = __importDefault(require("./session"));
const model_1 = __importDefault(require("./model"));
const filterModels_1 = __importStar(require("./model/filterModels"));
const navigationBuilder_1 = require("./model/navigationBuilder");
const persistence_1 = __importDefault(require("./persistence"));
const icons_1 = __importDefault(require("./icons"));
const auth_1 = __importDefault(require("./auth"));
const withAuth_1 = __importDefault(require("./auth/withAuth"));
const content_1 = __importStar(require("./content"));
const settings_1 = __importDefault(require("./settings"));
const media_1 = __importDefault(require("./media"));
const apiBuilder_1 = __importDefault(require("./api/apiBuilder"));
const swaggerUi_1 = __importDefault(require("./api/swaggerUi"));
const HttpError_1 = __importDefault(require("./HttpError"));
const ContentPersistence_1 = __importDefault(require("./persistence/ContentPersistence"));
exports.ContentPersistence = ContentPersistence_1.default;
const responseTimeLogger_1 = __importDefault(require("./responseTimeLogger"));
const MigrationContext_1 = __importDefault(require("./persistence/MigrationContext"));
exports.MigrationContext = MigrationContext_1.default;
const http_proxy_middleware_1 = require("http-proxy-middleware");
const child_process_1 = require("child_process");
var persistence_2 = require("./persistence");
Object.defineProperty(exports, "Persistence", { enumerable: true, get: function () { return persistence_2.Persistence; } });
var knex_1 = require("./persistence/adapter/knex");
Object.defineProperty(exports, "knexAdapter", { enumerable: true, get: function () { return __importDefault(knex_1).default; } });
// export * from "../typings";
var FsStorage_1 = require("./media/storage/FsStorage");
Object.defineProperty(exports, "FsStorage", { enumerable: true, get: function () { return __importDefault(FsStorage_1).default; } });
__exportStar(require("./utils"), exports);
const root = path.resolve(__dirname, "../dist/client");
let index;
function getIndexHtml(basePath) {
    if (!index)
        index = fs.readFileSync(path.join(root, "index.html"), "utf8");
    return index.replace(/\/admin\//g, `${(0, url_join_1.default)(basePath, "/admin")}/`);
}
const startDevServer = () => {
    process.stdout.write("Starting development server...\n");
    const child = (0, child_process_1.spawn)(`npm run watch`, [], {
        cwd: path.resolve(__dirname, "../client/"),
        shell: true
    });
    child.stdout.on("data", (data) => {
        const string = data.toString();
        if (string.includes("Compiled successfully!")) {
            process.stdout.write("Development server updated!\n");
        }
        if (string.includes("Compiling...\n")) {
            process.stdout.write("Development server compiling...\n");
        }
        if (string.includes("Failed to compile.") ||
            string.includes("TypeScript error")) {
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
const clientMiddleware = (basePath = "/") => process.env.DEVCLIENT // Use Proxy to Dev Server
    ? [
        (0, http_proxy_middleware_1.createProxyMiddleware)("/static", {
            target: `http://localhost:4001`,
            logLevel: "error",
            changeOrigin: true
        }),
        (0, http_proxy_middleware_1.createProxyMiddleware)((0, url_join_1.default)(basePath, "/admin"), {
            target: `http://localhost:4001`,
            logLevel: "error",
            changeOrigin: true,
            pathRewrite: { [`^/${basePath}/`]: "/" }
        })
    ]
    : (0, express_promise_router_1.default)()
        .use((0, url_join_1.default)(basePath, "/admin"), express_1.default.static(root, {
        maxAge: "1y",
        immutable: true,
        index: false // index.html will be served by the fallback middleware
    }), (_, res, next) => {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        next();
    })
        .use((0, url_join_1.default)(basePath, "/admin"), (req, res, next) => {
        if ((req.method === "GET" || req.method === "HEAD") &&
            req.accepts("html")) {
            res.send(getIndexHtml(basePath));
        }
        else
            next();
    });
exports.clientMiddleware = clientMiddleware;
function getModels(opts) {
    const externalDataSources = (opts.externalDataSources || []).map(withAuth_1.default);
    return {
        models: (0, model_1.default)(opts.models, externalDataSources),
        externalDataSources
    };
}
const getBaseURLS = (basePath) => {
    if (!basePath) {
        return {
            cms: "/",
            media: (0, url_join_1.default)("/", "/media"),
            preview: "/"
        };
    }
    if (typeof basePath === "string") {
        return {
            cms: basePath,
            media: (0, url_join_1.default)(basePath, "/media"),
            preview: basePath
        };
    }
    return {
        cms: basePath.cms,
        media: basePath.media ? basePath.media : (0, url_join_1.default)(basePath.cms, "/media"),
        preview: basePath.preview || basePath.cms
    };
};
async function getRestApiBuilder(opts) {
    const { basePath } = opts;
    const { models } = getModels(opts);
    return (0, content_1.getRestApiBuilder)(models, getBaseURLS(basePath).cms);
}
exports.getRestApiBuilder = getRestApiBuilder;
async function init(opts) {
    const { models, externalDataSources } = getModels(opts);
    const { basePath, storage, thumbnailProvider, responseHeaders, contentHooks, migrationDir } = opts;
    const baseURLS = getBaseURLS(basePath);
    const mediaUrl = baseURLS.media;
    const persistence = await (0, persistence_1.default)(models, await opts.persistenceAdapter, {
        basePath: baseURLS.cms,
        mediaUrl,
        contentHooks,
        migrationDir
    });
    const auth = (0, auth_1.default)(persistence, opts.anonymousPermissions, models);
    const content = (0, content_1.default)({
        persistence,
        models,
        externalDataSources,
        basePath: baseURLS.cms,
        mediaUrl,
        responseHeaders
    });
    const settings = (0, settings_1.default)(persistence, models);
    const media = (0, media_1.default)(persistence, models, storage, thumbnailProvider, baseURLS.cms);
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use((0, session_1.default)(opts.sessionOpts));
    if (process.env.PERFORMANCE_LOGGING === "true") {
        app.use(responseTimeLogger_1.default);
    }
    app.all("/status", (req, res) => {
        res.json({
            uptime: process.uptime(),
            nodeVersion: process.version,
            memory: process.memoryUsage(),
            pid: process.pid
        });
    });
    const router = (0, express_promise_router_1.default)();
    app.use(baseURLS.cms.replace(/\/$/, ""), router);
    auth.routes(router); // login, principal, logout
    media.routes(router); // static, thumbs
    settings.routes(router); // admin/rest/settings
    icons_1.default.routes(router); // icons
    router.get("/admin/rest/info", async (req, res) => {
        if (!req.principal || !req.principal.id)
            return res.json({});
        const filteredModels = (0, filterModels_1.default)(models, req.principal);
        const filter = (0, filterModels_1.createModelFilter)(req.principal);
        const filteredInfo = (0, navigationBuilder_1.buildInfo)(opts.navigation || [], models, filter);
        res.json(Object.assign(Object.assign({}, filteredInfo), { models: filteredModels, baseUrls: baseURLS, user: req.principal }));
    });
    // This routes purpose is to provide all content options
    // for the MapInput inside the built-in roles models
    router.get("/admin/rest/info/content", (req, res) => {
        const filteredModels = (0, filterModels_1.default)(models, req.principal);
        res.json(filteredModels.content.map(m => ({ value: m.name, label: m.singular })));
    });
    router.get("/admin/rest/info/settings", (req, res) => {
        const filteredModels = (0, filterModels_1.default)(models, req.principal);
        res.json(filteredModels.settings.map(m => m.name));
    });
    auth.describe(apiBuilder_1.default);
    media.describe(apiBuilder_1.default);
    content.describe(apiBuilder_1.default);
    settings.describe(apiBuilder_1.default);
    router.get("/admin/rest/swagger.json", (req, res) => {
        res.json(apiBuilder_1.default.getSpec());
    });
    router.use("/admin/rest/docs", (0, swaggerUi_1.default)((0, url_join_1.default)(baseURLS.cms, "admin/rest/docs/"), (0, url_join_1.default)(baseURLS.cms, "admin/rest/swagger.json")));
    router.get("/admin/rest", (req, res) => res.redirect((0, url_join_1.default)(baseURLS.cms, "admin/rest/docs")));
    content.routes(router);
    if (process.env.DEVCLIENT) {
        startDevServer();
    }
    app.use((opts.clientMiddleware && opts.clientMiddleware(baseURLS.cms)) ||
        (0, exports.clientMiddleware)(baseURLS.cms));
    if (opts.customSetup) {
        opts.customSetup(app, persistence.content, persistence.settings);
    }
    app.get(baseURLS.cms, (_, res) => res.redirect((0, url_join_1.default)(baseURLS.cms, "admin")));
    app.use((err, req, res, _) => {
        if (err instanceof HttpError_1.default) {
            res.status(err.status);
        }
        else {
            log_1.default.error(req.method, req.path, err);
            res.status(500);
        }
        res.end(err.message);
        return;
    });
    return { app, persistence };
}
exports.init = init;
//# sourceMappingURL=index.js.map