"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const login_1 = __importDefault(require("../auth/login"));
const PermissionDeniedError_1 = __importDefault(require("../auth/PermissionDeniedError"));
const ReferenceConflictError_1 = __importDefault(require("../persistence/errors/ReferenceConflictError"));
const UniqueFieldError_1 = __importDefault(require("../persistence/errors/UniqueFieldError"));
const ContentEventError_1 = __importDefault(require("../persistence/errors/ContentEventError"));
const utils_1 = require("./rest/utils");
exports.default = (router, { persistence, models, externalDataSources }) => {
    const { content } = persistence;
    // all models that have their own page
    const linkableModels = (0, utils_1.linkableModelNames)(models.content);
    const getDataSource = (modelName) => {
        return (externalDataSources.find(({ contentTypes }) => {
            return contentTypes.includes(modelName);
        }) || content);
    };
    const getModel = (modelName) => {
        const model = models.content.find(m => m.name === modelName);
        if (model)
            return model;
        throw new Error("No such model: " + modelName);
    };
    router.use("/admin/rest/content", login_1.default);
    /** Search */
    router.get("/admin/rest/content", async (req, res) => {
        const { principal, query } = req;
        /* tslint:disable-next-line:no-shadowed-variable */
        const { q, limit = 50, offset = 0, models = [], linkable } = query;
        const items = await content.search(principal, q, true, {
            limit,
            offset,
            models: !!models.length ? models : linkable ? linkableModels : []
        });
        res.json(items);
    });
    router.use("/admin/rest/externalDataSource", login_1.default);
    /** Search */
    router.get("/admin/rest/externalDataSource", async (req, res) => {
        const { principal, query } = req;
        /* tslint:disable-next-line:no-shadowed-variable */
        const { q, limit = 50, offset = 0, models = [""] } = query;
        const model = models[0];
        const dataSource = externalDataSources.find(({ contentTypes }) => {
            return contentTypes.includes(model);
        });
        if (!dataSource) {
            return res.status(500).end();
        }
        const { total, items } = await dataSource.list(principal, getModel(model), {
            limit,
            offset,
            models: [model],
            ...(q
                ? {
                    search: {
                        term: q
                    }
                }
                : {})
        });
        res.json({
            total,
            items: items.filter(content.canView(principal))
        });
    });
    /** Dashboard routes  */
    router.use("/admin/rest/dashboard", login_1.default);
    router.get("/admin/rest/dashboard/unpublished", async (req, res) => {
        const { principal, query } = req;
        const { limit = 50, offset = 0 } = query;
        const items = await content.listUnpublishedContent(principal, {
            limit,
            offset
        });
        res.json(items);
    });
    router.get("/admin/rest/dashboard/updated", async (req, res) => {
        const { query, principal } = req;
        const { limit = 50, offset = 0 } = query;
        const items = await content.listLastUpdatedContent(principal, {
            limit,
            offset
        });
        res.json(items);
    });
    router.get("/admin/rest/dashboard/updated-by-user", async (req, res) => {
        const { principal, query } = req;
        const { limit = 50, offset = 0 } = query;
        const items = await content.listLastUpdatedContent(principal, { limit, offset }, true);
        res.json(items);
    });
    /** List  */
    router.get("/admin/rest/content/:modelName", async (req, res) => {
        const { principal, params, query } = req;
        const { modelName } = params;
        const { search = {}, limit = 50, offset = 0, ...rest } = query;
        const criteria = rest && Object.keys(rest).length ? rest : undefined;
        const opts = { search, offset, limit };
        const model = getModel(modelName);
        const { total, items } = await getDataSource(modelName).list(principal, model, opts, criteria);
        res.json({
            total,
            items
        });
    });
    /** Load */
    router.get("/admin/rest/content/:modelName/:id", async (req, res) => {
        const { principal, params } = req;
        const { modelName, id } = params;
        const model = getModel(modelName);
        const item = await getDataSource(modelName).loadInternal(principal, model, id);
        if (!item)
            res.status(404).end();
        else
            res.json(item);
    });
    /** Create */
    router.post("/admin/rest/content/:modelName", async (req, res) => {
        const { params, body, principal } = req;
        const { modelName } = params;
        const model = getModel(modelName);
        const dataSource = getDataSource(modelName);
        if (typeof dataSource.create === "undefined") {
            res.status(404).end();
            return;
        }
        const data = lodash_1.default.pick(body.data, [...Object.keys(model.fields)]);
        const { id, data: responseData } = await dataSource.create(principal, model, data, models.content);
        return res.json({ id, data: responseData });
    });
    router.delete("/admin/rest/content/:modelName/:id", async (req, res) => {
        const { principal, params } = req;
        const { modelName, id } = params;
        const model = getModel(modelName);
        const dataSource = getDataSource(modelName);
        if (typeof dataSource.delete === "undefined") {
            res.status(404).end();
            return;
        }
        await dataSource.delete(principal, model, id);
        res.status(204).end();
    });
    /* update */
    router.put("/admin/rest/content/:modelName/:id", async (req, res) => {
        const { principal, params, body } = req;
        const { modelName, id } = params;
        const model = getModel(modelName);
        const dataSource = getDataSource(modelName);
        if (typeof dataSource.update === "undefined") {
            res.status(404).end();
            return;
        }
        const data = lodash_1.default.pick(body, [...Object.keys(model.fields)]);
        const item = await dataSource.update(principal, model, id, data, models.content);
        return res.json(item);
    });
    router.get("/admin/rest/content/:modelName/:id/versions", async (req, res) => {
        const { principal, params } = req;
        const { modelName, id } = params;
        const model = getModel(modelName);
        const dataSource = getDataSource(modelName);
        if (typeof dataSource.listVersions === "undefined") {
            res.status(404).end();
            return;
        }
        const versions = await dataSource.listVersions(principal, model, id);
        if (!versions)
            res.status(404).end();
        else
            res.json(versions);
    });
    router.get("/admin/rest/content/:modelName/:id/versions/:rev", async (req, res) => {
        const { principal, params } = req;
        const { modelName, id, rev } = params;
        const model = getModel(modelName);
        const dataSource = getDataSource(modelName);
        if (typeof dataSource.loadRevision === "undefined") {
            res.status(404).end();
            return;
        }
        const item = await dataSource.loadRevision(principal, model, id, rev);
        if (!item)
            res.status(404).end();
        else
            res.json(item);
    });
    router.post("/admin/rest/content/:modelName/:id/publish", async (req, res) => {
        const { principal, params, body } = req;
        const { modelName, id } = params;
        const rev = body.rev;
        const model = getModel(modelName);
        const dataSource = getDataSource(modelName);
        if (typeof dataSource.publishRevision === "undefined") {
            res.status(404).end();
            return;
        }
        await dataSource.publishRevision(principal, model, id, rev, models.content);
        res.status(204).end();
    });
    router.post("/admin/rest/content/:modelName/:id/schedule", async (req, res) => {
        const { principal, params, body } = req;
        const { modelName, id } = params;
        const model = getModel(modelName);
        const dataSource = getDataSource(modelName);
        const { visibleFrom = null, visibleUntil = null } = body;
        await dataSource.schedule(principal, model, id, {
            visibleFrom: visibleFrom && new Date(visibleFrom),
            visibleUntil: visibleUntil && new Date(visibleUntil)
        });
        return res.status(204).end();
    });
    router.get("/admin/rest/content/:modelName/:id/item", async (req, res) => {
        const { principal, params } = req;
        const { modelName, id } = params;
        const model = getModel(modelName);
        const dataSource = getDataSource(modelName);
        const item = await dataSource.loadItem(principal, model, id);
        if (!item)
            res.status(404).end();
        else
            res.json(item);
    });
    router.use((err, req, res, next) => {
        if (err instanceof PermissionDeniedError_1.default) {
            return res.status(403).end();
        }
        if (err instanceof ReferenceConflictError_1.default) {
            return res.status(400).json({ conflictingRefs: err.refs });
        }
        if (err instanceof UniqueFieldError_1.default) {
            return res.status(409).json({ uniqueErrors: err.nonUniqueFields });
        }
        if (err instanceof ContentEventError_1.default) {
            res.statusMessage = err.message;
            return res.status(418).end();
        }
        if (err) {
            console.error(err);
            return res.status(500).end();
        }
        next();
    });
};
//# sourceMappingURL=routes.js.map