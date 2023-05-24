"use strict";
/**
 * The part of the persistence layer that handles the content.
 */
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
const escapeRegExp_1 = __importDefault(require("lodash/escapeRegExp"));
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const removeDeprecatedData_1 = __importDefault(require("./removeDeprecatedData"));
const ReferenceConflictError_1 = __importDefault(require("./errors/ReferenceConflictError"));
const acl_1 = require("../auth/acl");
const getRefUrl_1 = __importDefault(require("../content/getRefUrl"));
const convert_1 = __importDefault(require("../content/convert"));
const filterRefData_1 = require("../content/rest/filterRefData");
const extractMatch_1 = __importDefault(require("../model/extractMatch"));
const extractText_1 = __importDefault(require("../model/extractText"));
const log_1 = __importDefault(require("../log"));
const visit_1 = __importStar(require("../model/visit"));
const setPosition_1 = __importDefault(require("../model/setPosition"));
const MigrationContext_1 = __importDefault(require("./MigrationContext"));
const filterModels_1 = require("../model/filterModels");
function findValueByPath(path, data) {
    if (!path)
        return;
    const titlePath = path.split(".");
    const title = titlePath.reduce((obj, key) => (obj ? obj[key] : undefined), data);
    return title;
}
class ContentPersistence {
    adapter;
    models;
    config;
    /** contentTypes is empty since this is the default/fallback implementation */
    contentTypes = [];
    constructor(adapter, models, config) {
        this.adapter = adapter;
        this.models = models;
        this.config = config;
    }
    getModel(name) {
        return this.models.find(m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    }
    canView(principal) {
        return (item) => {
            if (!item || !item.model)
                return false;
            const model = this.getModel(item.model);
            if (!model)
                return false;
            return !principal || (0, acl_1.isAllowed)(principal, model, acl_1.Permission.view);
        };
    }
    async applyPreHooks(event, model, data) {
        if (!this.config.contentHooks || !this.config.contentHooks.preHooks)
            return data;
        const preHook = this.config.contentHooks.preHooks[event];
        if (!preHook)
            return data;
        try {
            const hookData = await preHook(model, data);
            return hookData;
        }
        catch (error) {
            log_1.default.error(`💥  An error occurred in the content preHook "${event}" for a "${model.name}" content`);
            log_1.default.error(error);
            return data;
        }
    }
    async applyPostHooks(event, model, dataRecord) {
        if (!this.config.contentHooks || !this.config.contentHooks.postHooks)
            return;
        const postHook = this.config.contentHooks.postHooks[event];
        if (!postHook)
            return;
        try {
            await postHook(model, dataRecord);
        }
        catch (error) {
            log_1.default.error(`💥  An error occurred in the content content postHook "${event}" for a "${model.name}" content`);
            log_1.default.error(error);
        }
    }
    createItem = (content) => {
        const { id, type, data } = content;
        const model = this.getModel(type);
        if (!model)
            return null;
        const { title: titlePath, image, singular, orderBy } = model;
        const title = findValueByPath(titlePath, data);
        const orderValue = findValueByPath(orderBy || title, data);
        return {
            id,
            model: type,
            type: model.type,
            title: title || singular,
            image: image && ((data || {})[image] || null),
            kind: singular,
            orderValue: orderValue || title
        };
    };
    createSearchResultItem = (content, term, external = true) => {
        const { id, type, data } = content;
        const model = this.getModel(type);
        if (!model)
            return null;
        const { title: titlePath, image, singular } = model;
        const title = findValueByPath(titlePath, data);
        return {
            id,
            type: external ? undefined : model.type,
            kind: external ? undefined : singular,
            title: title || singular,
            description: (0, extractMatch_1.default)(data, model, term, !external),
            image: image && ((data || {})[image] || null),
            model: model.name,
            url: external ? (0, getRefUrl_1.default)(data, model.urlPath) : undefined
        };
    };
    createItems(contents, principal) {
        return contents.map(this.createItem).filter(this.canView(principal));
    }
    async create(principal, model, data, models) {
        data = this.setOrderPosition(data, model, models);
        const hookData = await this.applyPreHooks("onCreate", model, data);
        const { storeData, searchData } = await this.splitStoreAndIndexData(hookData, model);
        // NOTE: principal.id will always be set since anonymous access is prevented by ACL.
        const id = await this.adapter.create(storeData, searchData, model, models, principal.id);
        this.applyPostHooks("onCreate", model, { id, data: storeData });
        return { id: String(id), data: storeData };
    }
    async createRevision(principal, model, id, data, models) {
        const { storeData, searchData } = await this.splitStoreAndIndexData(data, model);
        // NOTE: principal.id will always be set since anonymous access is prevented by ACL.
        const rev = await this.adapter.createRevision(storeData, searchData, model, models, id, principal.id);
        return { rev, data: storeData };
    }
    async fetchRefs(ids, contentFormat, previewOpts = {}, join = {}, model) {
        // load all content the loaded content is referencing
        const contentRefs = await this.adapter.loadContentReferences(ids, model, this.models, previewOpts, (0, filterRefData_1.getDeepJoins)(join, this.models));
        // load meta data for media file for this content and all the references
        const mediaRefs = await this.adapter.loadMediaFromContents(ids.concat(contentRefs.map(c => c.id)), previewOpts.publishedOnly);
        // sort content into type categories
        const sortedContentRefs = {};
        contentRefs.forEach(({ data, ...ref }) => {
            // ignore unknown content
            const contentModel = this.getModel(ref.type);
            if (!contentModel)
                return;
            if (!sortedContentRefs[ref.type]) {
                sortedContentRefs[ref.type] = {};
            }
            sortedContentRefs[ref.type][ref.id] = {
                ...ref,
                data
            };
        });
        // convert sorted references
        // we need to separate the sorting step from the converting step
        // because we need the whole refs object to convert correctly (urls)
        Object.entries(sortedContentRefs).forEach(([type, items]) => {
            const contentModel = this.getModel(type);
            return Object.values(items).forEach(item => {
                return {
                    ...item,
                    data: (0, convert_1.default)({
                        content: (0, removeDeprecatedData_1.default)(item.data, contentModel),
                        contentModel,
                        contentRefs: sortedContentRefs,
                        contentFormat,
                        allModels: this.models,
                        mediaUrl: this.config.mediaUrl,
                        previewOpts
                    })
                };
            });
        });
        // assign media refs to an object with it's ids as keys
        const media = {};
        mediaRefs.forEach(r => {
            media[r.id] = r;
        });
        return { content: sortedContentRefs, media };
    }
    async load(principal, model, id, join = {}, contentFormat, previewOpts) {
        const content = await this.adapter.load(model, id, previewOpts);
        if (!content)
            return content;
        const refs = await this.fetchRefs([id], contentFormat, previewOpts, join, model);
        const convertedContentData = (0, convert_1.default)({
            content: (0, removeDeprecatedData_1.default)(content.data, model),
            contentRefs: refs.content,
            contentModel: model,
            contentFormat,
            allModels: this.models,
            mediaUrl: this.config.mediaUrl,
            previewOpts
        });
        return {
            ...content,
            data: convertedContentData,
            _refs: refs
        };
    }
    async loadInternal(principal, model, id, previewOpts) {
        const content = await this.adapter.load(model, id, previewOpts);
        if (content) {
            (0, removeDeprecatedData_1.default)(content.data, model, true);
        }
        return content;
    }
    async loadItem(principal, model, id) {
        const content = await this.adapter.load(model, id);
        if (content) {
            return this.createItem(content);
        }
        return null;
    }
    async loadRevision(principal, model, id, rev) {
        const content = await this.adapter.loadRevision(model, id, rev);
        if (content) {
            (0, removeDeprecatedData_1.default)(content.data, model);
        }
        return content;
    }
    listVersions(principal, model, id) {
        return this.adapter.listVersions(model, id);
    }
    async update(principal, model, id, data, models) {
        const hookData = await this.applyPreHooks("onSave", model, data);
        const rev = await this.createRevision(principal, model, id, hookData, models);
        const resp = {
            id: String(id),
            data: rev.data
        };
        this.applyPostHooks("onSave", model, resp);
        return resp;
    }
    async schedule(principal, model, id, schedule) {
        await this.adapter
            .schedule(model, id, schedule)
            .catch(err => this.processReferenceConflictError(principal, err));
        const content = await this.adapter.load(model, id);
        if (content) {
            this.applyPostHooks("onSchedule", model, content);
        }
    }
    async publishRevision(principal, model, id, rev, models) {
        const resp = await this.adapter
            .setPublishedRev(model, id, rev, models)
            .catch(err => this.processReferenceConflictError(principal, err));
        const content = await this.adapter.load(model, id);
        if (content) {
            this.applyPostHooks(rev !== null ? "onPublish" : "onUnpublish", model, content);
        }
        return resp;
    }
    async delete(principal, model, id) {
        const content = await this.adapter.load(model, id);
        const resp = await this.adapter
            .delete(model, id)
            .catch(err => this.processReferenceConflictError(principal, err));
        if (content) {
            this.applyPostHooks("onDelete", model, content);
        }
        return resp;
    }
    async list(principal, model, opts, criteria) {
        if (!opts.orderBy) {
            opts.orderBy = model.orderBy || model.title;
        }
        if (!opts.order) {
            opts.order = model.order || "desc";
        }
        const { total, items } = await this.adapter.list(model, this.models, opts, criteria);
        return {
            total,
            items: this.createItems(items)
        };
    }
    async findByMedia(media) {
        const contents = await this.adapter.findByMedia(media);
        return this.createItems(contents);
    }
    async find(principal, model, opts, contentFormat, join, criteria, previewOpts) {
        const items = await this.adapter.list(model, this.models, opts, criteria, previewOpts);
        if (!items.total)
            return { ...items, _refs: { content: {}, media: {} } };
        const _refs = await this.fetchRefs(items.items.map(i => i.id), contentFormat, previewOpts, join, model);
        const convertedItems = {
            ...items,
            items: items.items.map(i => ({
                ...i,
                data: (0, convert_1.default)({
                    content: (0, removeDeprecatedData_1.default)(i.data, model),
                    contentRefs: _refs.content,
                    contentModel: model,
                    contentFormat,
                    allModels: this.models,
                    mediaUrl: this.config.mediaUrl,
                    previewOpts
                })
            }))
        };
        return { ...convertedItems, _refs };
    }
    async findInternal(principal, model, opts, criteria, previewOpts) {
        return this.adapter.list(model, this.models, opts, criteria, previewOpts);
    }
    async search(principal, term, exact, opts, previewOpts) {
        const { total, items } = await this.adapter.search(term, exact, opts, previewOpts);
        return {
            total,
            items: items
                .map(c => this.createSearchResultItem(c, term, false))
                .filter(this.canView(principal))
        };
    }
    async externalSearch(principal, term, opts, previewOpts) {
        const clearedTerm = term.replace("*", " ");
        const textSearch = await this.adapter.search(clearedTerm.length > 0 ? clearedTerm : " ", false, opts, previewOpts);
        const items = textSearch.items
            .map(c => this.createSearchResultItem(c, term))
            .filter(this.canView(principal));
        return {
            total: textSearch.total,
            items
        };
    }
    async suggest(principal, term, previewOpts) {
        const { items } = await this.adapter.search(term, true, {}, previewOpts);
        const pattern = `${(0, escapeRegExp_1.default)(term)}([\\w|ü|ö|ä|ß|Ü|Ö|Ä]*['|\\-|\\/|_|+]*[\\w|ü|ö|ä|ß|Ü|Ö|Ä]+|[\\w|ü|ö|ä|ß|Ü|Ö|Ä]*)`;
        const re = new RegExp(pattern, "ig");
        const terms = [];
        items.forEach(item => {
            const model = this.getModel(item.type);
            if (model && this.canView(principal)({ model: item.type })) {
                const text = (0, extractText_1.default)(item.data, model);
                const m = text.match(re);
                if (m) {
                    m.forEach(s => {
                        const cleaned = s.trim();
                        if (cleaned &&
                            !terms.some(t => t.toLowerCase() === cleaned.toLowerCase()))
                            terms.push(cleaned);
                    });
                }
            }
        });
        return terms.sort((a, b) => a.length - b.length || a.localeCompare(b));
    }
    rewrite(modelName, iterator) {
        const model = this.getModel(modelName);
        if (!model)
            throw new Error(`No such model: ${modelName}`);
        return this.adapter.rewrite(model, this.models, async (data, meta) => {
            let rewritten = await iterator(data, meta);
            if (rewritten) {
                rewritten = await this.applyPreHooks("onSave", model, rewritten);
                return this.splitStoreAndIndexData(rewritten, model);
            }
            return rewritten;
        });
    }
    migrate(migrations) {
        this.adapter.migrate(migrations, async (adapter, outstanding) => {
            const content = new ContentPersistence(adapter, this.models, this.config);
            const ctx = new MigrationContext_1.default(content);
            for (const m of outstanding) {
                await m.execute(ctx);
            }
        });
    }
    createItemsWithAuthorAndDate = (listChunk) => {
        return this.createItems(listChunk.items).map((i, idx) => {
            const { date, author } = listChunk.items[idx];
            return { ...i, date, author_name: author };
        });
    };
    async listLastUpdatedContent(principal, opts = { limit: 50, offset: 0 }, byUser) {
        const filteredModels = this.models.filter((0, filterModels_1.createModelFilter)(principal));
        const listChunk = await this.adapter.listLastUpdatedContent(filteredModels.map(m => m.name), opts, byUser ? principal.id : undefined);
        return {
            total: listChunk.total,
            items: this.createItemsWithAuthorAndDate(listChunk)
        };
    }
    async listUnpublishedContent(principal, opts) {
        const filteredModels = this.models.filter((0, filterModels_1.createModelFilter)(principal));
        const listChunk = await this.adapter.listUnpublishedContent(filteredModels.map(m => m.name), opts);
        return {
            total: listChunk.total,
            items: this.createItemsWithAuthorAndDate(listChunk)
        };
    }
    processReferenceConflictError = (principal, err) => {
        if (err instanceof ReferenceConflictError_1.default && err.refs) {
            err.refs = this.createItems(err.refs, principal);
            throw err;
        }
    };
    async setOrderPosition(data, model, models) {
        if (model.orderBy) {
            const lastItem = await this.adapter.list(model, models, {
                limit: 1,
                orderBy: model.orderBy,
                order: "desc",
                offset: 0
            });
            const orderPath = model.orderBy.split(".");
            const lastOrderValue = orderPath.reduce((obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined), lastItem.total > 0 ? lastItem.items[0].data : {});
            data = (0, setPosition_1.default)(data, model, lastOrderValue);
        }
        return data;
    }
    splitStoreAndIndexData(data, model) {
        const storeData = (0, cloneDeep_1.default)(data);
        (0, visit_1.default)(storeData, model, {
            string: (_, field) => {
                if (field.store === false)
                    return visit_1.NO_STORE_VALUE;
            }
        });
        return { storeData, searchData: data };
    }
}
exports.default = ContentPersistence;
//# sourceMappingURL=ContentPersistence.js.map