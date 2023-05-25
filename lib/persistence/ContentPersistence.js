/**
 * The part of the persistence layer that handles the content.
 */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import _escapeRegExp from "lodash/escapeRegExp";
import _cloneDeep from "lodash/cloneDeep";
import removeDeprecatedData from "./removeDeprecatedData";
import ReferenceConflictError from "./errors/ReferenceConflictError";
import { isAllowed, Permission } from "../auth/acl";
import getRefUrl from "../content/getRefUrl";
import convert from "../content/convert";
import { getDeepJoins } from "../content/rest/filterRefData";
import extractMatch from "../model/extractMatch";
import extractText from "../model/extractText";
import log from "../log";
import visit, { NO_STORE_VALUE } from "../model/visit";
import setPosition from "../model/setPosition";
import MigrationContext from "./MigrationContext";
import { createModelFilter } from "../model/filterModels";
function findValueByPath(path, data) {
    if (!path)
        return;
    const titlePath = path.split(".");
    const title = titlePath.reduce((obj, key) => (obj ? obj[key] : undefined), data);
    return title;
}
export default class ContentPersistence {
    constructor(adapter, models, config) {
        /** contentTypes is empty since this is the default/fallback implementation */
        this.contentTypes = [];
        this.createItem = (content) => {
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
        this.createSearchResultItem = (content, term, external = true) => {
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
                description: extractMatch(data, model, term, !external),
                image: image && ((data || {})[image] || null),
                model: model.name,
                url: external ? getRefUrl(data, model.urlPath) : undefined
            };
        };
        this.createItemsWithAuthorAndDate = (listChunk) => {
            return this.createItems(listChunk.items).map((i, idx) => {
                const { date, author } = listChunk.items[idx];
                return Object.assign(Object.assign({}, i), { date, author_name: author });
            });
        };
        this.processReferenceConflictError = (principal, err) => {
            if (err instanceof ReferenceConflictError && err.refs) {
                err.refs = this.createItems(err.refs, principal);
                throw err;
            }
        };
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
            return !principal || isAllowed(principal, model, Permission.view);
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
            log.error(`💥  An error occurred in the content preHook "${event}" for a "${model.name}" content`);
            log.error(error);
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
            log.error(`💥  An error occurred in the content content postHook "${event}" for a "${model.name}" content`);
            log.error(error);
        }
    }
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
        const contentRefs = await this.adapter.loadContentReferences(ids, model, this.models, previewOpts, getDeepJoins(join, this.models));
        // load meta data for media file for this content and all the references
        const mediaRefs = await this.adapter.loadMediaFromContents(ids.concat(contentRefs.map(c => c.id)), previewOpts.publishedOnly);
        // sort content into type categories
        const sortedContentRefs = {};
        contentRefs.forEach((_a) => {
            var { data } = _a, ref = __rest(_a, ["data"]);
            // ignore unknown content
            const contentModel = this.getModel(ref.type);
            if (!contentModel)
                return;
            if (!sortedContentRefs[ref.type]) {
                sortedContentRefs[ref.type] = {};
            }
            sortedContentRefs[ref.type][ref.id] = Object.assign(Object.assign({}, ref), { data });
        });
        // convert sorted references
        // we need to separate the sorting step from the converting step
        // because we need the whole refs object to convert correctly (urls)
        Object.entries(sortedContentRefs).forEach(([type, items]) => {
            const contentModel = this.getModel(type);
            return Object.values(items).forEach(item => {
                return Object.assign(Object.assign({}, item), { data: convert({
                        content: removeDeprecatedData(item.data, contentModel),
                        contentModel,
                        contentRefs: sortedContentRefs,
                        contentFormat,
                        allModels: this.models,
                        mediaUrl: this.config.mediaUrl,
                        previewOpts
                    }) });
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
        const convertedContentData = convert({
            content: removeDeprecatedData(content.data, model),
            contentRefs: refs.content,
            contentModel: model,
            contentFormat,
            allModels: this.models,
            mediaUrl: this.config.mediaUrl,
            previewOpts
        });
        return Object.assign(Object.assign({}, content), { data: convertedContentData, _refs: refs });
    }
    async loadInternal(principal, model, id, previewOpts) {
        const content = await this.adapter.load(model, id, previewOpts);
        if (content) {
            removeDeprecatedData(content.data, model, true);
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
            removeDeprecatedData(content.data, model);
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
            return Object.assign(Object.assign({}, items), { _refs: { content: {}, media: {} } });
        const _refs = await this.fetchRefs(items.items.map(i => i.id), contentFormat, previewOpts, join, model);
        const convertedItems = Object.assign(Object.assign({}, items), { items: items.items.map(i => (Object.assign(Object.assign({}, i), { data: convert({
                    content: removeDeprecatedData(i.data, model),
                    contentRefs: _refs.content,
                    contentModel: model,
                    contentFormat,
                    allModels: this.models,
                    mediaUrl: this.config.mediaUrl,
                    previewOpts
                }) }))) });
        return Object.assign(Object.assign({}, convertedItems), { _refs });
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
        const pattern = `${_escapeRegExp(term)}([\\w|ü|ö|ä|ß|Ü|Ö|Ä]*['|\\-|\\/|_|+]*[\\w|ü|ö|ä|ß|Ü|Ö|Ä]+|[\\w|ü|ö|ä|ß|Ü|Ö|Ä]*)`;
        const re = new RegExp(pattern, "ig");
        const terms = [];
        items.forEach(item => {
            const model = this.getModel(item.type);
            if (model && this.canView(principal)({ model: item.type })) {
                const text = extractText(item.data, model);
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
            const ctx = new MigrationContext(content);
            for (const m of outstanding) {
                await m.execute(ctx);
            }
        });
    }
    async listLastUpdatedContent(principal, opts = { limit: 50, offset: 0 }, byUser) {
        const filteredModels = this.models.filter(createModelFilter(principal));
        const listChunk = await this.adapter.listLastUpdatedContent(filteredModels.map(m => m.name), opts, byUser ? principal.id : undefined);
        return {
            total: listChunk.total,
            items: this.createItemsWithAuthorAndDate(listChunk)
        };
    }
    async listUnpublishedContent(principal, opts) {
        const filteredModels = this.models.filter(createModelFilter(principal));
        const listChunk = await this.adapter.listUnpublishedContent(filteredModels.map(m => m.name), opts);
        return {
            total: listChunk.total,
            items: this.createItemsWithAuthorAndDate(listChunk)
        };
    }
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
            data = setPosition(data, model, lastOrderValue);
        }
        return data;
    }
    splitStoreAndIndexData(data, model) {
        const storeData = _cloneDeep(data);
        visit(storeData, model, {
            string: (_, field) => {
                if (field.store === false)
                    return NO_STORE_VALUE;
            }
        });
        return { storeData, searchData: data };
    }
}
//# sourceMappingURL=ContentPersistence.js.map