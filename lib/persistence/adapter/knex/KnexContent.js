"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extractRefs_1 = __importDefault(require("../../../model/extractRefs"));
const extractText_1 = __importDefault(require("../../../model/extractText"));
const extractValues_1 = __importDefault(require("../../../model/extractValues"));
const lookup_1 = require("./lookup");
const ReferenceConflictError_1 = __importDefault(require("../../errors/ReferenceConflictError"));
const flatten_1 = __importDefault(require("lodash/flatten"));
const update_1 = __importDefault(require("lodash/update"));
const UniqueFieldError_1 = __importDefault(require("../../errors/UniqueFieldError"));
const setPosition_1 = __importDefault(require("../../../model/setPosition"));
const getAlwaysUniqueFields_1 = __importDefault(require("../../../model/getAlwaysUniqueFields"));
const getPositionFields_1 = require("../../../model/getPositionFields");
const getInverseReferenceFields_1 = __importDefault(require("../../../model/getInverseReferenceFields"));
const log_1 = __importDefault(require("../../../log"));
const visitModel_1 = __importDefault(require("../../../model/visitModel"));
const visit_1 = __importDefault(require("../../../model/visit"));
const ops = {
    eq: "=",
    ne: "<>",
    gt: ">",
    lt: "<",
    gte: ">=",
    lte: "<=",
    like: "like"
};
const getFieldFromModelPath = (path, model) => {
    const fieldPath = path.split(".");
    return fieldPath.reduce((acc, el, index, arr) => {
        const last = arr.length - 1 === index;
        if (acc[el].type === "object" && !last) {
            return acc[el].fields;
        }
        if (acc[el].type === "list") {
            if (acc[el].item.type === "object" && !last) {
                return acc[el].item.fields;
            }
            return acc[el].item;
        }
        if (acc[el].type === "immutable") {
            if (acc[el].child.type === "object" && !last) {
                return acc[el].child.fields;
            }
            return acc[el].child;
        }
        return acc[el];
    }, model.fields);
};
const getRecursiveOrderField = (orderPath, m, prefix = "", uniqueFields = [
    ...(m.uniqueFields || []),
    "title" in m ? m.title : "",
    "orderBy" in m ? m.orderBy : ""
]) => {
    const [field, ...restPath] = orderPath.split(".");
    const type = m.fields[field];
    if (!type) {
        return false;
    }
    if (type.type === "list" && type.item) {
        if (type.item.type === "object" && type.item.fields) {
            return getRecursiveOrderField(restPath.join("."), type.item, prefix + field + ".", uniqueFields);
        }
        if ((type.item.type === "string" || type.item.type === "number") &&
            (type.item.index || uniqueFields.includes(prefix + field))) {
            return { isNumeric: type.item.type === "number", withUpperCase: false };
        }
        return false;
    }
    if (type.type === "object" && type.fields) {
        return getRecursiveOrderField(restPath.join("."), type, prefix + field + ".", uniqueFields);
    }
    if ((type.type === "string" ||
        type.type === "number" ||
        type.type === "position") &&
        (type.index || uniqueFields.includes(prefix + field))) {
        return {
            isNumeric: type.type === "number",
            withUpperCase: type.type === "position"
        };
    }
    return false;
};
const getModel = (name, models) => models.find(m => m.name.toLowerCase() === name.toLowerCase());
class KnexContent {
    constructor(inputKnex) {
        this.knex = inputKnex;
    }
    async create(storeData, indexData, model, models, author) {
        await this.testUniqueFields(model, models, storeData);
        const [id] = await this.knex("contents")
            .insert({
            type: model.name
        })
            .returning("id");
        storeData = await this.testPositionFields(model, models, storeData, id);
        await this.createRev(storeData, indexData, model, models, id, 1, author);
        return id;
    }
    /**
     * Test if the any fields in data that are marked as unique in the model
     * already exists.
     */
    async testUniqueFields(model, models, data, id) {
        let nonUniqueFields = [];
        const uniqueFields = (0, getAlwaysUniqueFields_1.default)(model, true);
        if (uniqueFields) {
            const resp = await Promise.all(uniqueFields.map(async (f) => {
                const criteria = {};
                const value = f
                    .split(".")
                    .reduce((obj, key) => obj && obj[key] !== "undefined" ? obj[key] : undefined, data);
                criteria[`data.${f}`] = { eq: value, ne: "" };
                const opts = { offset: 0, limit: 1 };
                const p1 = this.list(model, models, opts, criteria);
                const p2 = this.list(model, models, opts, criteria, {
                    publishedOnly: true,
                    ignoreSchedule: true
                });
                const res = await Promise.all([p1, p2]);
                const items = (0, flatten_1.default)(res.map(r => r.items));
                const existing = items.find(i => i.id.toString() !== (id && id.toString()));
                if (existing) {
                    return { field: f, existingContentId: existing.id };
                }
            }));
            const IsDefined = Boolean;
            nonUniqueFields = resp.filter(IsDefined);
        }
        if (nonUniqueFields.length)
            throw new UniqueFieldError_1.default(nonUniqueFields);
    }
    /**
     * Test if a value of a position field already Exists
     */
    async testPositionFields(model, models, data, id) {
        const positionFields = (0, getPositionFields_1.getPositionFieldsWithValue)(data, model);
        if (positionFields.length > 0) {
            await Promise.all(positionFields.map(async ({ fieldPath, value }) => {
                const criteria = value
                    ? {
                        [`data.${fieldPath}`]: { gte: value }
                    }
                    : {};
                const opts = {
                    offset: 0,
                    limit: 3,
                    orderBy: fieldPath,
                    order: value ? "asc" : "desc"
                };
                const items = await this.list(model, models, opts, criteria, {
                    ignoreSchedule: true
                });
                if (items.items[0]) {
                    (0, visit_1.default)(items.items[0].data, model, {
                        position(s, f, d, stringPath) {
                            if (stringPath === fieldPath) {
                                if (!value) {
                                    // No Position Value passed, use end of list
                                    data = (0, setPosition_1.default)(data, model, s, "z", true, fieldPath);
                                }
                                else if (s === value &&
                                    String(items.items[0].id) !== String(id) // Value exists, and is not same document
                                ) {
                                    if (items.items[1]) {
                                        // get next one and middle it
                                        (0, visit_1.default)(items.items[1].data, model, {
                                            position(nextPosition, g, h, nextStringPath) {
                                                if (nextStringPath === fieldPath) {
                                                    data = (0, setPosition_1.default)(data, model, value, nextPosition, true, fieldPath);
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        // No next one, just middle to end
                                        data = (0, setPosition_1.default)(data, model, value, "z", true, fieldPath);
                                    }
                                }
                            }
                        }
                    });
                }
            }));
        }
        return data;
    }
    async createRevision(storeData, indexData, model, models, id, author) {
        storeData = await this.testPositionFields(model, models, storeData, id);
        await this.testUniqueFields(model, models, storeData, id);
        const [content] = await this.knex("contents")
            .select(["latest_rev"])
            .where({ id });
        const rev = (content.latest_rev || 0) + 1;
        return this.createRev(storeData, indexData, model, models, id, rev, author);
    }
    async createRev(data, searchData, model, models, id, rev, author) {
        await this.knex("content_revisions").insert({
            id,
            rev,
            data: JSON.stringify(data),
            author
        });
        // Set the new revision as latest on the content
        await this.knex("contents").where({ id }).update({ latest_rev: rev });
        await this.indexRevision(data, searchData, model, models, id, rev);
        return rev;
    }
    async indexRevision(data, searchData, model, models, id, rev, published = false) {
        // Delete content_values except the published ones
        await this.knex("content_values").where({ id, published }).del();
        // Delete content_search except the published one
        await this.knex("content_search").where({ id, published }).del();
        await this.extractValues(data, model, id, rev, published);
        await this.extractText(searchData, model, id, rev, published);
        const refs = (0, extractRefs_1.default)(data, model, models);
        if (refs.length) {
            // Insert refs one by one in case a foreign key constraint violation occurs.
            // In a perfect world there shouldn't be any dead references in the first place, but...
            for (const refKey in refs) {
                if (refs.hasOwnProperty(refKey)) {
                    const ref = refs[refKey];
                    try {
                        await this.knex("content_references").insert(Object.assign({ id,
                            rev }, ref));
                    }
                    catch (error) {
                        log_1.default.error("createRev: " + error.code);
                        log_1.default.error(error.sqlMessage);
                        log_1.default.error("SQL: " + error.sql);
                    }
                }
            }
        }
    }
    extractValues(data, model, id, rev, published) {
        const values = (0, extractValues_1.default)(data, model);
        const rows = [];
        Object.entries(values).forEach(([field, value]) => {
            const fieldType = getFieldFromModelPath(field, model);
            if (Array.isArray(value)) {
                return value.forEach(val => rows.push(Object.assign({ id,
                    rev,
                    published,
                    field }, (0, lookup_1.serialize)(val, fieldType))));
            }
            return rows.push(Object.assign({ id,
                rev,
                published,
                field }, (0, lookup_1.serialize)(value, fieldType)));
        });
        return this.knex.batchInsert("content_values", rows);
    }
    extractText(data, model, id, rev, published) {
        const text = `${model.singular} ${(0, extractText_1.default)(data, model)}`.toLowerCase();
        return this.knex("content_search").insert({
            id,
            rev,
            published,
            text
        });
    }
    loadRefs(ids, types, previewOpts = {}) {
        const refs = this.knex
            .distinct(["crv.data", "c.id", "c.type"])
            .from("content_references as cr")
            .whereIn("cr.id", ids)
            .innerJoin("contents as co", j => {
            j.on("cr.id", "co.id");
            j.on("cr.rev", previewOpts.publishedOnly ? "co.published_rev" : "co.latest_rev");
        })
            .innerJoin("contents as c", j => {
            j.on("c.id", "cr.content");
            j.andOn("c.deleted", "=", this.knex.raw("false"));
        })
            .innerJoin("content_revisions as crv", j => {
            j.on("crv.id", "c.id");
            j.andOn("crv.rev", previewOpts.publishedOnly ? "c.published_rev" : "c.latest_rev");
        });
        if (types) {
            refs.whereIn("c.type", types);
        }
        if (previewOpts.publishedOnly && !previewOpts.ignoreSchedule) {
            refs.andWhere((k2) => {
                k2.where("c.visibleFrom", "<=", new Date()).orWhereNull("c.visibleFrom");
            });
            refs.andWhere((k2) => {
                k2.where("c.visibleUntil", ">=", new Date()).orWhereNull("c.visibleUntil");
            });
        }
        return refs;
    }
    loadInverseRefs(ids, types, previewOpts = {}) {
        const refs = this.knex
            .distinct(["crv.data", "c.id", "c.type"])
            .from("content_references as cr")
            .whereIn("cr.content", ids)
            .innerJoin("contents as c", j => {
            j.on("c.id", "cr.id");
            j.andOn("c.deleted", "=", this.knex.raw("false"));
        })
            .innerJoin("content_revisions as crv", j => {
            j.on("crv.id", "c.id");
            j.andOn("crv.rev", previewOpts.publishedOnly ? "c.published_rev" : "c.latest_rev");
        });
        if (types) {
            refs.whereIn("c.type", types);
        }
        if (previewOpts.publishedOnly && !previewOpts.ignoreSchedule) {
            refs.andWhere((k2) => {
                k2.where("c.visibleFrom", "<=", new Date()).orWhereNull("c.visibleFrom");
            });
            refs.andWhere((k2) => {
                k2.where("c.visibleUntil", ">=", new Date()).orWhereNull("c.visibleUntil");
            });
        }
        return refs;
    }
    async loadContentReferences(id, model, models, previewOpts = {}, joins = [{}]) {
        let fullData = [];
        const getModelNames = (checkModels) => {
            const foundModels = [];
            checkModels.forEach(name => {
                const foundModel = getModel(name, models);
                if (foundModel)
                    foundModels.push(foundModel.name);
            });
            return foundModels;
        };
        const fetch = async (ids, types, prevTypes, first) => {
            // Only get references when needed
            // since this can be a expensive db operation
            let hasRefs = false;
            let hasInverseRefs = false;
            let implicitTypes = [];
            (first ? [model.name] : prevTypes).forEach(typeName => {
                const typeModel = first ? model : getModel(typeName, models);
                if (!typeModel)
                    return;
                (0, visitModel_1.default)(typeModel, (_, value) => {
                    if (!("type" in value))
                        return;
                    if (value.type === "references") {
                        hasRefs = true;
                        // No types means this data is only needed to populate _urls in refs
                        if (types.length === 0) {
                            implicitTypes = implicitTypes.concat(getModelNames([value.model]));
                        }
                    }
                    if (value.type === "content") {
                        hasInverseRefs = true;
                        // No types means this data is only needed to populate _urls in refs
                        if (types.length === 0) {
                            implicitTypes = implicitTypes.concat(getModelNames(("models" in value && value.models) || [value.model]));
                        }
                    }
                    if (value.type === "richtext") {
                        hasInverseRefs = true;
                    }
                });
            });
            // we don't need to load anything if a model has no refs and it is a first level fetch
            // otherwise we still need to load the main data of that join
            if (first && !hasRefs && !hasInverseRefs)
                return [];
            const refTypes = !!types.length ? types : implicitTypes;
            const refs = hasInverseRefs
                ? this.loadRefs(ids, !first && refTypes, previewOpts)
                : [];
            const inverseRefs = hasRefs
                ? this.loadInverseRefs(ids, !first && refTypes, previewOpts)
                : [];
            const [data, inverseData] = await Promise.all([refs, inverseRefs]);
            if (inverseData) {
                return data
                    .concat(inverseData)
                    .map((d) => this.parseData(d));
            }
            return data.map((d) => this.parseData(d));
        };
        let checkIds = id;
        /**
         * Go one level deeper than joins suggest in order to provide
         * enough data to populate all _url fields later on
         */
        for (let i = 0; i < joins.length + 1; i++) {
            const join = joins[i];
            const data = await fetch(checkIds, Object.keys(join || {}), Object.keys(joins[i - 1] || {}), i === 0);
            fullData = [...fullData, ...data];
            checkIds = data.map(d => d.id);
        }
        return fullData;
    }
    async loadMediaFromContents(ids, published) {
        return (await this.knex
            .select(["media.*"])
            .from("content_references")
            .join("contents", j => {
            j.on("contents.id", "content_references.id");
            j.on(published ? "contents.published_rev" : "contents.latest_rev", "content_references.rev");
        })
            .join("media", j => {
            j.on("content_references.media", "media.id");
        })
            .whereIn("contents.id", ids)
            .andWhere("contents.deleted", false));
    }
    async load(model, id, previewOpts = {}) {
        const k = this.knex("contents")
            .join("content_revisions", join => {
            join.on("contents.id", "content_revisions.id");
            join.on(previewOpts.publishedOnly
                ? "contents.published_rev"
                : "contents.latest_rev", "content_revisions.rev");
        })
            .where({
            "contents.id": id,
            "contents.type": model.name,
            "contents.deleted": false
        });
        if (previewOpts.publishedOnly && !previewOpts.ignoreSchedule) {
            k.andWhere((k2) => {
                k2.where("contents.visibleFrom", "<=", new Date()).orWhereNull("contents.visibleFrom");
            });
            k.andWhere((k2) => {
                k2.where("contents.visibleUntil", ">=", new Date()).orWhereNull("contents.visibleUntil");
            });
        }
        const inverseReferences = (0, getInverseReferenceFields_1.default)(model);
        if (inverseReferences.length > 0) {
            const inverseRefs = this.knex("content_references as iRef")
                .select(this.aggregateRefs("iCont.id", "iCont.type", "iRef.fieldnames"))
                .leftJoin("contents as iCont", join => {
                join.on("iRef.id", "iCont.id");
                join.andOn("iRef.rev", previewOpts.publishedOnly
                    ? "iCont.published_rev"
                    : "iCont.latest_rev");
            })
                .where("iRef.content", this.knex.ref("contents.id"))
                .andWhere(where => {
                where.whereNull("iRef.id");
                where.orWhereNotNull("iCont.id");
            })
                .groupBy("iRef.content")
                .as("inverseRefs");
            k.select(inverseRefs);
        }
        const content = await k
            .select(["contents.*", "content_revisions.data"])
            .first();
        return content ? this.parseData(content, model) : null;
    }
    async loadRevision(model, id, rev) {
        const content = await this.knex("content_revisions as cr")
            .join("contents as c", "c.id", "cr.id")
            .where({
            "cr.id": id,
            "cr.rev": rev,
            "c.type": model.name,
            "c.deleted": false
        })
            .first("c.id", "cr.data");
        return content && { id: content.id, rev, data: JSON.parse(content.data) };
    }
    async listVersions(model, id) {
        const versions = await this.knex("content_revisions as cr")
            .join("contents as c", "cr.id", "c.id")
            .join("users", "users.id", "cr.author")
            .where({
            "c.type": model.name,
            "c.id": id
        })
            .select([
            "c.type",
            "c.id",
            "c.latest_rev",
            "c.published_rev",
            "cr.rev",
            "cr.date",
            "users.name as author_name",
            this.knex.raw("c.latest_rev = cr.rev as latest"),
            this.knex.raw("c.published_rev = cr.rev as published")
        ])
            .orderBy("cr.rev", "desc");
        return versions.map((v) => (Object.assign(Object.assign({}, v), { latest: !!v.latest, published: !!v.published })));
    }
    async setPublishedRev(model, id, publishedRev, models) {
        if (publishedRev === null) {
            // Check if content is referenced by another content
            await this.checkReferrers(id);
        }
        // TODO: check if referenced content still exists
        // Delete values from previously published revision
        await this.knex("content_values").where({ id, published: true }).del();
        // Delete search from previously published revision
        await this.knex("content_search").where({ id, published: true }).del();
        if (publishedRev !== null) {
            // Insert values for newly published revision
            const { data } = await this.loadRevision(model, id, publishedRev);
            const c = await this.knex("contents").where({ id }).first();
            await this.checkReferences(id, publishedRev, c);
            await this.extractValues(data, model, id, publishedRev, true);
            await this.extractText(data, model, id, publishedRev, true);
        }
        // Update the published_rev column
        await this.knex("contents")
            .where({ id, type: model.name })
            .update({ published_rev: publishedRev });
    }
    /**
     * Make sure all referenced contents are either optional or:
     * - published
     * - visible before the referring content
     * - visible until the referring content expires
     */
    async checkReferences(id, rev, schedule) {
        const { visibleFrom, visibleUntil } = schedule;
        const references = await this.knex
            .distinct(["contents.id", "contents.type", "content_revisions.data"])
            .from("content_references")
            .join("contents", join => {
            join.on("contents.id", "content_references.content");
        })
            .join("content_revisions", join => {
            join.on("content_revisions.id", "contents.id");
            join.on("content_revisions.rev", "contents.latest_rev"); // return latest rev so that user can find it by title
        })
            .where({
            "content_references.id": id,
            "content_references.rev": rev,
            "content_references.optional": false
        })
            .andWhere(k => {
            k.whereNull("contents.published_rev");
            // refs that expire before the referring content
            if (visibleUntil)
                k.orWhere("contents.visibleUntil", "<", visibleUntil);
            else
                k.orWhereNotNull("contents.visibleUntil");
            // refs that become visible after the referring content
            k.orWhere("contents.visibleFrom", ">", new Date(Math.max(visibleFrom ? visibleFrom.getTime() : 0, Date.now())));
        });
        if (references.length > 0) {
            const err = new ReferenceConflictError_1.default({ type: "content" });
            err.refs = references.map((ref) => this.parseData(ref));
            throw err;
        }
    }
    /**
     * Make sure all contents referring to the given id are either deleted,
     * no longer visible (or - TODO - optional).
     */
    async checkReferrers(id) {
        const contents = await this.knex
            .distinct(["contents.id", "contents.type", "content_revisions.data"])
            .from("content_references")
            .join("contents", join => {
            join.on("contents.id", "content_references.id");
            join.andOn("contents.published_rev", "content_references.rev");
        })
            .join("content_revisions", join => {
            join.on("content_revisions.id", "contents.id");
            join.on("content_revisions.rev", "contents.latest_rev"); // return latest rev so that user can find it by title
        })
            .where({ content: id, optional: false })
            .andWhere("contents.deleted", false)
            .andWhere((k // still visible
        ) => k
            .where("contents.visibleUntil", ">", new Date())
            .orWhereNull("contents.visibleUntil"));
        if (contents.length > 0) {
            // TODO action delete/unpublish/schedule
            const err = new ReferenceConflictError_1.default({ type: "content" });
            err.refs = contents.map((c) => this.parseData(c));
            throw err;
        }
    }
    async delete(model, id) {
        await this.checkReferrers(id);
        await this.knex("contents")
            .where({ type: model.name, id })
            .update({ deleted: true });
        await this.knex("content_references").where({ id }).del();
    }
    async schedule(model, id, schedule) {
        const { visibleFrom = null, visibleUntil = null } = schedule;
        const c = await this.knex("contents")
            .where({ type: model.name, id })
            .first();
        const rev = c.published_rev || c.latest_rev;
        await this.checkReferrers(id);
        await this.checkReferences(id, rev, schedule);
        await this.knex("contents")
            .where({ type: model.name, id })
            .update({
            visibleFrom: visibleFrom && new Date(visibleFrom),
            visibleUntil: visibleUntil && new Date(visibleUntil)
        });
    }
    async search(term, exact, listOpts, previewOpts = {}) {
        let k;
        let text = term || "";
        const searchTable = text ? "content_search" : "contents";
        if (text) {
            text = term.toLowerCase().trim();
            k = this.knex("content_search");
            if (this.knex.client.config.client === "pg") {
                k.whereRaw("text @@ plainto_tsquery(?)", `${text}:*`);
            }
            else if (this.knex.client.config.client === "mysql") {
                if (exact) {
                    k.where("text", "like", `%${text}%`);
                }
                else {
                    k.whereRaw("MATCH(text) AGAINST(?)", text);
                }
            }
            else {
                if (exact) {
                    k.where("text", "like", `%${text}%`);
                }
                else {
                    text.split(/\s+/).forEach(t => k.andWhere("text", "like", `%${t}%`));
                }
            }
            k.join("contents", join => {
                join.on("content_search.id", "contents.id");
                join.on("content_search.rev", previewOpts.publishedOnly
                    ? "contents.published_rev"
                    : "contents.latest_rev");
            });
        }
        else {
            k = this.knex("contents");
        }
        if (previewOpts.publishedOnly && !previewOpts.ignoreSchedule) {
            k.andWhere((k2) => {
                k2.where("contents.visibleFrom", "<=", new Date()).orWhereNull("contents.visibleFrom");
            });
            k.andWhere((k2) => {
                k2.where("contents.visibleUntil", ">=", new Date()).orWhereNull("contents.visibleUntil");
            });
        }
        k.join("content_revisions", join => {
            join.on(`${searchTable}.id`, "content_revisions.id");
            if (term) {
                join.on("content_search.rev", "content_revisions.rev");
            }
            else {
                join.on(`contents.${previewOpts.publishedOnly ? "published_rev" : "latest_rev"}`, "content_revisions.rev");
            }
        });
        k.whereNot("contents.deleted", true);
        const { limit = 50, offset = 0, models = [] } = listOpts;
        if (models.length > 0) {
            k.andWhere("contents.type", "in", models.map(m => m));
        }
        const [count] = await k.clone().countDistinct(`${searchTable}.id as total`);
        const total = Number(count.total);
        k.distinct([
            `${searchTable}.id`,
            "contents.type",
            "content_revisions.data",
            ...(!exact
                ? [
                    this.knex.raw(`(case when text like ? then 1 else 2 end) as isExact`, `%${text}%`)
                ]
                : [])
        ]);
        k.offset(Number(offset)).limit(Number(limit));
        if (!exact) {
            k.orderBy("isExact");
        }
        const items = await k;
        return {
            total,
            items: items.map((i) => this.parseData(i))
        };
    }
    async findByMedia(media) {
        const contents = await this.knex
            .distinct(["contents.id", "contents.type", "content_revisions.data"])
            .from("content_references")
            .join("contents", join => {
            join.on("contents.id", "content_references.id");
            join.on(j => {
                j.on("contents.latest_rev", "content_references.rev");
                j.orOn("contents.published_rev", "content_references.rev");
            });
        })
            .join("content_revisions", join => {
            join.on("content_revisions.id", "contents.id");
            join.on("content_revisions.rev", "contents.latest_rev");
        })
            .where("content_references.media", "=", media)
            .andWhere("contents.deleted", false);
        return contents.map((c) => this.parseData(c));
    }
    async list(model, models, listOpts = {}, criteria = {}, previewOpts = {}) {
        const { limit = 50, offset = 0, order = "desc", orderBy, search } = listOpts;
        // only order by comparable fields
        const orderByFieldExists = orderBy
            ? getRecursiveOrderField(orderBy, model)
            : false;
        const k = this.knex("contents").where({
            "contents.type": model.name,
            "contents.deleted": false
        });
        if (previewOpts.publishedOnly && !previewOpts.ignoreSchedule) {
            k.andWhere((k2) => {
                k2.where("contents.visibleFrom", "<=", new Date()).orWhereNull("contents.visibleFrom");
            });
            k.andWhere((k2) => {
                k2.where("contents.visibleUntil", ">=", new Date()).orWhereNull("contents.visibleUntil");
            });
        }
        k.join("content_revisions", join => {
            join.on("contents.id", "content_revisions.id");
            join.on(previewOpts.publishedOnly
                ? "contents.published_rev"
                : "contents.latest_rev", "content_revisions.rev");
        });
        if (search && search.term) {
            if (search.scope === "title") {
                if (model.title)
                    criteria[model.title] = { like: `%${search.term}%` };
            }
            else {
                const searchTerm = search.term.toLowerCase().trim();
                k.join("content_search", join => {
                    join.on("contents.id", "content_search.id");
                    join.on(previewOpts.publishedOnly
                        ? "contents.published_rev"
                        : "contents.latest_rev", "content_search.rev");
                });
                if (this.knex.client.config.client === "pg") {
                    k.whereRaw("content_search.text @@ plainto_tsquery(?)", `${searchTerm}:*`);
                }
                else if (this.knex.client.config.client === "mysql") {
                    k.whereRaw("match(text) against(?)", searchTerm);
                }
                else {
                    searchTerm
                        .split(/\s+/)
                        .forEach(t => k.andWhere("text", "like", `%${t}%`));
                }
            }
        }
        if (criteria) {
            Object.entries(criteria).forEach(([dataPath, criterion], j) => {
                if (model.customQuery && model.customQuery[dataPath]) {
                    dataPath = model.customQuery[dataPath];
                }
                if (typeof criterion === "string") {
                    criterion = { eq: criterion };
                }
                let fieldPath = dataPath.replace(/^data\./, "").split(".");
                if (criterion.path) {
                    fieldPath = [...fieldPath, ...criterion.path.split(".")];
                    delete criterion.path;
                }
                let lastContent = "contents";
                let lastModel = model;
                fieldPath.reduce((acc, pathStep, i, arr) => {
                    const path = acc + pathStep;
                    const counter = String(i) + String(j);
                    const isLast = arr.length - 1 === i;
                    const field = getFieldFromModelPath(path, lastModel);
                    if (field.type === "object") {
                        return path + ".";
                    }
                    if (field.type === "content" &&
                        !("externalDataSource" in field) &&
                        (field.model ||
                            ("models" in field && field.models && field.models.length === 1)) // Get Docs which referenced by document
                    ) {
                        // TODO: Criteria works just with one Model
                        const selectModel = field.model ||
                            ("models" in field && field.models && field.models[0]) ||
                            "";
                        k.innerJoin("content_references as ref" + counter, join => {
                            join.on(`ref${counter}.id`, `${lastContent}.id`);
                            join.andOn(`ref${counter}.rev`, previewOpts.publishedOnly
                                ? `${lastContent}.published_rev`
                                : `${lastContent}.latest_rev`);
                        });
                        k.innerJoin("contents as cont" + counter, join => {
                            join.on(`ref${counter}.content`, `cont${counter}.id`);
                            join.andOnIn(`cont${counter}.type`, [selectModel]);
                        });
                        lastContent = `cont${counter}`;
                        lastModel = models.find(m => m.name.toLocaleLowerCase() === selectModel.toLocaleLowerCase());
                        if (isLast) {
                            // If last compare with ID of Content
                            Object.entries(criterion).forEach(([op, value]) => {
                                const sqlOp = ops[op];
                                if (!sqlOp)
                                    throw new Error("Unsupported operator: " + op);
                                if (op === "eq" && Array.isArray(value)) {
                                    return k.whereIn(`${lastContent}.id`, value);
                                }
                                k.andWhere(`${lastContent}.id`, sqlOp, value);
                            });
                        }
                        return "";
                    }
                    if (field.type === "references") {
                        // Get Docs which reference document
                        const selectModel = field.model;
                        k.innerJoin("content_references as ref" + counter, join => {
                            join.on(`ref${counter}.content`, `${lastContent}.id`);
                        });
                        k.innerJoin("contents as cont" + counter, join => {
                            join.on(`ref${counter}.rev`, previewOpts.publishedOnly
                                ? `cont${counter}.published_rev`
                                : `cont${counter}.latest_rev`);
                            join.andOn(`ref${counter}.id`, `cont${counter}.id`);
                            join.andOnIn(`cont${counter}.type`, [field.model]);
                        });
                        lastContent = `cont${counter}`;
                        lastModel = models.find(m => m.name.toLocaleLowerCase() === selectModel.toLocaleLowerCase());
                        if (isLast) {
                            // If last compare with ID of Content
                            Object.entries(criterion).forEach(([op, value]) => {
                                const sqlOp = ops[op];
                                if (!sqlOp)
                                    throw new Error("Unsupported operator: " + op);
                                if (op === "eq" && Array.isArray(value)) {
                                    return k.whereIn(`${lastContent}.id`, value);
                                }
                                if (op === "ne" && Array.isArray(value)) {
                                    return k.whereNotIn(`${lastContent}.id`, value);
                                }
                                k.andWhere(`${lastContent}.id`, sqlOp, value);
                            });
                        }
                        return "";
                    }
                    k.innerJoin("content_values as vals" + counter, join => {
                        join.on(`vals${counter}.rev`, previewOpts.publishedOnly
                            ? `${lastContent}.published_rev`
                            : `${lastContent}.latest_rev`);
                        join.andOn(`vals${counter}.id`, `${lastContent}.id`);
                        join.andOnIn(`vals${counter}.field`, [path]);
                        Object.entries(criterion).forEach(([op, value]) => {
                            const sqlOp = ops[op];
                            if (!sqlOp)
                                throw new Error("Unsupported operator: " + op);
                            if ((0, lookup_1.isComparable)(field)) {
                                if (op === "eq" && Array.isArray(value)) {
                                    return k.whereIn(`vals${counter}.numeric`, value);
                                }
                                if (op === "ne" && Array.isArray(value)) {
                                    return k.whereNotIn(`vals${counter}.numeric`, value);
                                }
                                k.andWhere(`vals${counter}.numeric`, sqlOp, (0, lookup_1.toNumber)(value, field));
                            }
                            else if (field.type === "position") {
                                const v = value ? String(value).trim() : value;
                                k.andWhere(`vals${counter}.literal`, sqlOp, v);
                            }
                            else {
                                if (op === "eq" && Array.isArray(value)) {
                                    return k.whereIn(`vals${counter}.literal_lc`, value.map(val => val.toLowerCase().trim()));
                                }
                                if (op === "ne" && Array.isArray(value)) {
                                    return k.whereNotIn(`vals${counter}.literal_lc`, value.map(val => val.toLowerCase().trim()));
                                }
                                const v = value ? String(value).toLowerCase().trim() : value;
                                k.andWhere(`vals${counter}.literal_lc`, sqlOp, v);
                            }
                        });
                    });
                    return "";
                }, "");
            });
        }
        if (orderBy && orderByFieldExists) {
            k.leftJoin("content_values as orderValue", join => {
                join.on("contents.id", "orderValue.id");
                join.on(previewOpts.publishedOnly
                    ? "contents.published_rev"
                    : "contents.latest_rev", "orderValue.rev");
                join.andOnIn("orderValue.field", [orderBy]);
            });
        }
        const [count] = await k.clone().countDistinct("contents.id as total");
        const total = Number(count.total);
        if (total === 0)
            return { total, items: [] };
        k.distinct(["contents.id"]); // TODO get rid of distinct?
        const inverseReferences = (0, getInverseReferenceFields_1.default)(model);
        if (inverseReferences.length > 0) {
            const inverseRefs = this.knex("content_references as iRef")
                .select(this.aggregateRefs("iCont.id", "iCont.type", "iRef.fieldNames"))
                .leftJoin("contents as iCont", join => {
                join.on("iRef.id", "iCont.id");
                join.andOn("iRef.rev", previewOpts.publishedOnly
                    ? "iCont.published_rev"
                    : "iCont.latest_rev");
            })
                .where("iRef.content", this.knex.ref("contents.id"))
                .andWhere(where => {
                where.whereNull("iRef.id");
                where.orWhereNotNull("iCont.id");
            })
                .groupBy("iRef.content")
                .as("inverseRefs");
            k.select(inverseRefs);
        }
        const orderByIsNumeric = orderByFieldExists && orderByFieldExists.isNumeric;
        const orderByUpperCase = orderByFieldExists && orderByFieldExists.withUpperCase;
        const orderByColumn = orderByFieldExists
            ? orderByIsNumeric
                ? "orderValue.numeric"
                : orderByUpperCase
                    ? "orderValue.literal"
                    : "orderValue.literal_lc"
            : null;
        k.offset(Number(offset)).limit(Number(limit));
        if (orderByColumn) {
            k.orderBy(orderByColumn, order);
            if (search && search.term && search.scope !== "title")
                k.orderBy("isExact");
        }
        else {
            if (search && search.term && search.scope !== "title")
                k.orderBy("isExact");
            k.orderBy("contents.id", order);
        }
        const selectColumns = [
            "contents.id",
            "contents.type",
            "contents.visibleFrom",
            "contents.visibleUntil",
            "content_revisions.data",
            ...(search && search.term && search.scope !== "title"
                ? [
                    this.knex.raw(`(case when content_search.text like '%${search.term
                        .toLowerCase()
                        .trim()}%' then 1 else 2 end) as isExact`)
                ]
                : [])
        ];
        if (orderByColumn) {
            selectColumns.push(orderByColumn);
        }
        const items = k.select(selectColumns);
        return {
            total,
            items: (await items).map((item) => this.parseData(item, model))
        };
    }
    async rewrite(model, models, iterator) {
        const revs = await this.knex("content_revisions as cr")
            .join("contents as c", "cr.id", "c.id")
            .where({
            "c.type": model.name
        })
            .select(["cr.id", "cr.rev", "c.latest_rev", "c.published_rev"]);
        for (const { id, rev, latest_rev, published_rev } of revs) {
            const { data } = await this.knex("content_revisions")
                .where({ id, rev })
                .first("data");
            const meta = {
                id,
                rev,
                latest: rev === latest_rev,
                published: rev === published_rev
            };
            const rewritten = await iterator(JSON.parse(data), meta);
            if (rewritten) {
                const { storeData, searchData } = rewritten;
                await this.knex("content_revisions")
                    .update("data", JSON.stringify(storeData))
                    .where({ id, rev });
                if (meta.latest || meta.published) {
                    await this.indexRevision(storeData, searchData, model, models, id, rev, rev === published_rev);
                }
            }
        }
    }
    async migrate(migrations, callback) {
        const applied = await this.knex("content_migrations").where({
            state: "applied"
        });
        const outstanding = migrations.filter(m => !applied.some((a) => a.name === m.name));
        if (!outstanding.length) {
            // Nothing left to migrate
            return;
        }
        const names = outstanding.map(({ name }) => name);
        try {
            // Mark outstanding migrations as 'pending'
            await this.knex("content_migrations").insert(names.map(name => ({ name, state: "pending" })));
            const tx = await this.knex.transaction(); // TODO: Fix Line
            try {
                await callback(new KnexContent(tx), outstanding);
                await tx.commit();
                // Mark migrations as 'applied'
                await this.knex("content_migrations")
                    .update({ state: "applied" })
                    .whereIn("name", names);
            }
            catch (err) {
                log_1.default.error("Content migration failed. Rolling back...");
                log_1.default.error(err);
                await tx.rollback();
                // Delete pending migrations
                await this.knex("content_migrations").whereIn("name", names).del();
            }
        }
        catch (err) {
            log_1.default.info("Waiting for migrations to be applied ...");
            // Poll until other node is ready
            return new Promise((resolve, reject) => {
                const poll = async (retries = 3 * 60) => {
                    // Wait until there are no more pending migrations
                    const [pending] = await this.knex("content_migrations")
                        .where({ state: "pending" })
                        .count("* as count");
                    // Note: resolve() -> resolve(true)
                    if (!pending.count)
                        resolve(true);
                    else if (!retries)
                        reject(new Error("Timeout while waiting for migrations to finish."));
                    else
                        setTimeout(() => poll(retries - 1), 1000);
                };
                poll();
            });
        }
    }
    async listLastUpdatedContent(models, opts, user) {
        const k = this.knex("contents")
            .join("content_revisions as cr", join => {
            join.on(`contents.id`, "cr.id");
            join.on("contents.latest_rev", "cr.rev");
        })
            .join("users", "users.id", "cr.author")
            .whereIn("type", models)
            .andWhere("contents.deleted", false);
        if (user) {
            k.andWhere("cr.author", user);
        }
        const [count] = await k.clone().count("contents.id as total");
        const total = Number(count.total);
        if (total === 0)
            return { total, items: [] };
        k.select([
            "contents.id",
            "contents.type",
            "cr.data",
            "cr.date",
            "users.name as author"
        ]);
        k.orderBy("cr.date", "desc");
        k.offset(Number(opts.offset)).limit(Number(opts.limit));
        const items = await k;
        return {
            total,
            items: items.map((i) => this.parseData(i))
        };
    }
    async listUnpublishedContent(models, opts) {
        const k = this.knex("contents")
            .join("content_revisions as cr", join => {
            join.on(`contents.id`, "cr.id");
            join.on("contents.latest_rev", "cr.rev");
        })
            .join("users", "users.id", "cr.author")
            .where(w => {
            w.where("contents.latest_rev", "<>", this.knex.raw("contents.published_rev")).orWhere("contents.published_rev", null);
        })
            .whereIn("type", models)
            .andWhere("contents.deleted", false);
        const [count] = await k.clone().count("contents.id as total");
        const total = Number(count.total);
        if (total === 0)
            return { total, items: [] };
        k.select([
            "contents.id",
            "contents.type",
            "cr.data",
            "cr.date",
            "users.name as author"
        ]);
        k.orderBy("cr.date", "desc");
        k.offset(Number(opts.offset)).limit(Number(opts.limit));
        const items = await k;
        return {
            total,
            items: items.map((i) => this.parseData(i))
        };
    }
    aggregateRefs(idCol, typeCol, fieldNamesCol) {
        const concatString = this.knex.client.config.client !== "pg"
            ? this.knex.client.config.client === "sqlite3"
                ? `GROUP_CONCAT(?? || ':' || ?? || ':' || ??)`
                : `GROUP_CONCAT(??, ':', ??, ':', ??)`
            : `ARRAY_AGG(?? || ':' || ?? || ':' || ??)`;
        return this.knex.raw(concatString, [fieldNamesCol, typeCol, idCol]);
    }
    parseData(_a, model) {
        var { data, inverseRefs } = _a, rest = __rest(_a, ["data", "inverseRefs"]);
        const parsedData = JSON.parse(data);
        if (inverseRefs && model) {
            const fields = (0, getInverseReferenceFields_1.default)(model);
            const refs = typeof inverseRefs === "string" ? inverseRefs.split(",") : inverseRefs;
            fields.forEach(field => {
                (0, update_1.default)(parsedData, field.path, () => []);
            });
            refs.forEach(ref => {
                const [, _fieldNames, _content, _id] = /(.+?):(.+?):(.+)/.exec(ref);
                const fieldNames = _fieldNames.split("~");
                fields.forEach(f => {
                    if (f.model === _content && fieldNames.includes(f.fieldName)) {
                        (0, update_1.default)(parsedData, f.path, val => (val || []).concat({
                            _ref: "content",
                            _content,
                            _id: String(_id)
                        }));
                    }
                });
            });
        }
        return Object.assign({ data: parsedData }, rest);
    }
}
exports.default = KnexContent;
//# sourceMappingURL=KnexContent.js.map