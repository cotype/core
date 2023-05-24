"use strict";
/// <reference path="../../../typings/request.d.ts"/>
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prepareSearchResults_1 = __importDefault(require("./prepareSearchResults"));
const filterRefData_1 = __importStar(require("./filterRefData"));
const acl_1 = require("../../auth/acl");
const utils_1 = require("./utils");
const pickFieldsFromResultData_1 = __importDefault(require("./pickFieldsFromResultData"));
const modes = ["published", "drafts"];
function routes(router, persistence, models, externalDataSources, mediaUrl, responseHeaders) {
    const { content, media } = persistence;
    const headers = responseHeaders && responseHeaders.rest;
    const linkableModels = (0, utils_1.linkableAndSearchableModelNames)(models);
    const searchableModels = (0, utils_1.searchableModelNames)(models);
    const getDataSource = (modelName) => {
        return (externalDataSources.find(({ contentTypes }) => {
            return contentTypes.includes(modelName);
        }) || content);
    };
    const getModels = (name) => {
        return models.find(m => m.name.toLowerCase() === name.toLowerCase());
    };
    // TODO: add test
    const checkPermissionToJoin = (principle, join = {}) => {
        const cleanJoin = (0, filterRefData_1.createJoin)(join, models);
        Object.keys(cleanJoin).forEach(j => {
            const model = getModels(j);
            if (!model)
                return;
            (0, acl_1.checkPermissions)(principle, model, acl_1.Permission.view);
        });
    };
    function getSearchModels(query) {
        const { includeModels = [], excludeModels = [], linkableOnly = "true" } = query;
        const all = linkableOnly === "true" ? linkableModels : searchableModels;
        const pickModels = (names) => all.filter(name => names.some(n => n.toLowerCase() === name.toLowerCase()));
        const includes = pickModels(includeModels);
        const excludes = pickModels(excludeModels);
        return includes.length ? includes : all.filter(n => !excludes.includes(n));
    }
    modes.forEach(mode => {
        /**
         * Set req.previewOpts, check preview permission and set cache headers.
         */
        router.use(`/rest/${mode}`, (req, res, next) => {
            if (mode === "drafts") {
                res.setHeader("Cache-Control", "private");
                if (headers && headers.drafts) {
                    Object.entries(headers.drafts).forEach(([key, value]) => res.setHeader(key, value));
                }
                req.previewOpts = { publishedOnly: false };
                if (!req.principal.permissions.preview) {
                    res.status(403).end();
                    return;
                }
            }
            else {
                res.setHeader("Cache-Control", "public, max-age=300");
                if (headers && headers.published) {
                    Object.entries(headers.published).forEach(([key, value]) => res.setHeader(key, value));
                }
                req.previewOpts = { publishedOnly: true };
            }
            res.header("Vary", "X-Richtext-Format");
            next();
        });
        /** Search */
        router.get(`/rest/${mode}/search/content`, async (req, res) => {
            const { principal, query } = req;
            const { term, limit = 50, offset = 0 } = query;
            const searchModels = getSearchModels(query);
            if (!searchModels.length) {
                return res.json({
                    total: 0,
                    items: [],
                    _refs: {
                        media: {},
                        content: {}
                    }
                });
            }
            const results = await content.externalSearch(principal, term, {
                limit,
                offset,
                models: searchModels
            }, req.previewOpts);
            const preparedResults = (0, prepareSearchResults_1.default)(results, models, mediaUrl);
            const imageData = await media.load(principal, preparedResults.mediaIds);
            const mediaObj = {};
            imageData.forEach(m => {
                mediaObj[m.id] = m;
            });
            res.json({
                total: results.total,
                items: preparedResults.items,
                _refs: {
                    media: mediaObj,
                    content: {}
                }
            });
        });
        router.get(`/rest/${mode}/search/suggest`, async (req, res) => {
            const { principal, query } = req;
            const { term } = query;
            const searchModels = getSearchModels(query);
            if (!searchModels.length) {
                return res.json([]);
            }
            const results = await content.suggest(principal, term, req.previewOpts);
            res.json(results);
        });
        models
            .filter(m => m.collection !== "iframe" && !m.noFeed)
            .forEach(model => {
            const type = model.name;
            // List
            router.get(`/rest/${mode}/${type}`, async (req, res) => {
                const { principal, query } = req;
                const { search = {}, limit = 50, offset = 0, join, order, orderBy, fields, ...rest } = query;
                const opts = { search, offset, limit, order, orderBy };
                checkPermissionToJoin(req.principal, join);
                const criteria = rest && Object.keys(rest).length ? rest : undefined;
                const format = req.get("x-richtext-format") || "html";
                const dataSource = getDataSource(type);
                // If collection is singleton, return the first item in the list
                if (model.collection === "singleton") {
                    let result = await dataSource.find(principal, model, opts, format, join, criteria, req.previewOpts);
                    if (result.total > 0) {
                        // Pick the selected fields
                        if (fields) {
                            result = (0, pickFieldsFromResultData_1.default)(result, fields);
                        }
                        const { items, _refs } = result;
                        const [item] = items;
                        return res.json({
                            ...item.data,
                            _id: item.id.toString(),
                            _refs: (0, filterRefData_1.default)(items, _refs, join, models)
                        });
                    }
                    res.status(404).end();
                }
                else {
                    let results = await dataSource.find(principal, model, opts, format, join, criteria, req.previewOpts);
                    if (fields) {
                        results = (0, pickFieldsFromResultData_1.default)(results, fields);
                    }
                    const { total, items, _refs } = results;
                    res.json({
                        total,
                        items: items.map(i => ({ _id: i.id.toString(), ...i.data })),
                        _refs: (0, filterRefData_1.default)(items, _refs, join, models)
                    });
                }
            });
            // load
            router.get(`/rest/${mode}/${type}/:id`, async (req, res) => {
                const { principal, params, query } = req;
                const { join, fields } = query;
                checkPermissionToJoin(req.principal, join);
                const dataSource = getDataSource(type);
                const format = req.get("x-richtext-format");
                let result = await dataSource.load(principal, model, params.id, join, format, req.previewOpts);
                if (!result)
                    return res.status(404).end();
                res.setHeader("last-modified", new Date(result.date).toUTCString());
                if (fields) {
                    result = (0, pickFieldsFromResultData_1.default)(result, fields);
                }
                res.json({
                    ...result.data,
                    _id: result.id.toString(),
                    _refs: (0, filterRefData_1.default)([result], result._refs, join, models)
                });
            });
            // loadByUniqueField
            if (model.uniqueFields) {
                model.uniqueFields.forEach(uniqueField => {
                    router.get(`/rest/${mode}/${type}/${uniqueField}/:uniqueValue`, async (req, res) => {
                        const { principal, query, params } = req;
                        const { join, fields } = query;
                        checkPermissionToJoin(req.principal, join);
                        const criteria = {
                            [`data.${uniqueField}`]: {
                                eq: params.uniqueValue
                            }
                        };
                        const format = req.get("x-richtext-format") || "html";
                        const dataSource = getDataSource(type);
                        let result = await dataSource.find(principal, model, { limit: 1, offset: 0 }, format, join, criteria, req.previewOpts);
                        if (!result.total)
                            return res.status(404).end();
                        if (fields) {
                            result = (0, pickFieldsFromResultData_1.default)(result, fields);
                        }
                        const { items, _refs } = result;
                        res.json({
                            ...items[0].data,
                            _id: items[0].id.toString(),
                            _refs: (0, filterRefData_1.default)(items, _refs, join, models)
                        });
                    });
                });
            }
        });
    });
}
exports.default = routes;
//# sourceMappingURL=routes.js.map