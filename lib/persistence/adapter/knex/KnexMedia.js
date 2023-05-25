"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ReferenceConflictError_1 = __importDefault(require("../../errors/ReferenceConflictError"));
const pick_1 = __importDefault(require("lodash/pick"));
const cleanSearchTerm_1 = __importDefault(require("./cleanSearchTerm"));
class KnexMedia {
    constructor(inputKnex) {
        this.knex = inputKnex;
    }
    create(media) {
        return __awaiter(this, void 0, void 0, function* () {
            const search = this.createSearchString(media.originalname, media.tags);
            yield this.knex("media").insert(Object.assign(Object.assign({}, media), { search }));
        });
    }
    list({ limit, offset, search, orderBy, order, mimetype, unUsed, used }) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = this.knex("media");
            if (mimetype) {
                q.where("mimetype", "LIKE", `%${mimetype}%`);
            }
            if (search) {
                const term = search.toLowerCase().trim();
                if (this.knex.client.config.client === "pg")
                    q.whereRaw("search @@ plainto_tsquery(?)", `${term}:*`);
                else if (this.knex.client.config.client === "mysql") {
                    q.whereRaw("MATCH(search) AGAINST(? IN BOOLEAN MODE)", (0, cleanSearchTerm_1.default)(term));
                }
                else {
                    q.where("search", "like", `%${term}%`);
                }
            }
            if (unUsed) {
                q.whereNotIn("media.id", subquery => {
                    subquery.select("media.id").from("media");
                    subquery.join("content_references", join => {
                        join.on("media.id", "content_references.media");
                    });
                    subquery.join("contents", join => {
                        join.on("contents.id", "content_references.id");
                        join.on(j => {
                            j.on("contents.latest_rev", "=", "content_references.rev");
                            j.orOn("contents.published_rev", "=", "content_references.rev");
                        });
                    });
                });
            }
            if (used) {
                q.whereIn("media.id", subquery => {
                    subquery.select("media.id").from("media");
                    subquery.join("content_references", join => {
                        join.on("media.id", "content_references.media");
                    });
                    subquery.join("contents", join => {
                        join.on("contents.id", "content_references.id");
                        join.on(j => {
                            j.on("contents.latest_rev", "=", "content_references.rev");
                            j.orOn("contents.published_rev", "=", "content_references.rev");
                        });
                    });
                });
            }
            const [count] = yield q.clone().countDistinct("media.id as total");
            const items = yield q
                .distinct("media.*")
                .offset(Number(offset || 0))
                .limit(Number(limit || 50))
                .orderBy(orderBy || "created_at", order || "desc");
            return {
                total: Number(count.total),
                items: items.map((i) => (Object.assign(Object.assign({}, i), { tags: JSON.parse(i.tags) })))
            };
        });
    }
    load(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const media = yield this.knex("media").whereIn("id", ids);
            media.forEach((m) => {
                m.tags = JSON.parse(m.tags);
            });
            return media;
        });
    }
    findByHash(hashes) {
        return __awaiter(this, void 0, void 0, function* () {
            const media = yield this.knex("media").whereIn("hash", hashes);
            media.forEach((m) => {
                m.tags = JSON.parse(m.tags);
            });
            return media;
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = (0, pick_1.default)(data, ["focusX", "focusY", "tags", "alt", "credit", "originalname"]);
            const [media] = yield this.knex("media").where({ id });
            if (!media)
                return false;
            if (typeof args.focusX !== undefined && args.focusX !== null)
                args.focusX = parseInt(args.focusX, 10);
            if (typeof args.focusY !== undefined && args.focusY !== null)
                args.focusY = parseInt(args.focusY, 10);
            const search = this.createSearchString(args.originalname, args.tags);
            if (typeof args.tags !== undefined) {
                args.tags = JSON.stringify(args.tags);
            }
            yield this.knex("media")
                .where({ id })
                .update(Object.assign(Object.assign({}, args), { search }));
            return true;
        });
    }
    delete(id, models) {
        return __awaiter(this, void 0, void 0, function* () {
            const unnecessaryReferences = yield this.knex("content_references")
                .where("media", "=", id)
                .join("contents", join => {
                join.on("contents.id", "content_references.id");
                join.on(j => {
                    j.on("contents.latest_rev", "<>", "content_references.rev");
                    j.andOn("contents.published_rev", "<>", "content_references.rev");
                });
            })
                .where("contents.deleted", false);
            const deadReferences = yield this.knex("content_references")
                .join("contents", join => {
                join.on("contents.id", "content_references.id");
            })
                .whereNotIn("contents.type", models.map(m => m.name));
            const deletableRefs = unnecessaryReferences.concat(deadReferences);
            // Intentionally not using forEach here (async/await + forEach = probably not what you expect )
            for (const refKey in deletableRefs) {
                if (deletableRefs.hasOwnProperty(refKey)) {
                    const { id: refId, rev, media } = deletableRefs[refKey];
                    yield this.knex("content_references")
                        .where({ id: refId, rev, media })
                        .del();
                }
            }
            // Check if it is referenced by other content:
            const [{ count }] = yield this.knex("content_references")
                .where({ media: id })
                .join("contents", join => {
                join.on("contents.id", "content_references.id");
                join.on(j => {
                    j.on("contents.latest_rev", "=", "content_references.rev");
                    j.orOn("contents.published_rev", "=", "content_references.rev");
                });
            })
                .andWhere("contents.deleted", false)
                .count("* as count");
            if (count)
                throw new ReferenceConflictError_1.default({ type: "content" });
            // delete all unnecessary content references
            yield this.knex("content_references")
                .andWhere("media", "=", id)
                .del();
            try {
                yield this.knex("media")
                    .where({ id })
                    .del();
            }
            catch (err) {
                // Currently user pictures are the place where media could be referenced.
                // If this ever changes we have to either probe the various places or
                // extract the information from the thrown error like the PgMedia adapter does.
                throw new ReferenceConflictError_1.default({
                    type: "settings",
                    model: "users",
                    field: "picture"
                });
            }
        });
    }
    createSearchString(name, tags) {
        let search = "";
        if (tags)
            search = tags.join(" ");
        search += ` ${name}`;
        return search.toLowerCase();
    }
}
exports.default = KnexMedia;
//# sourceMappingURL=KnexMedia.js.map