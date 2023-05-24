"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MediaPersistence {
    adapter;
    content;
    settings;
    constructor(adapter, content, settings) {
        this.adapter = adapter;
        this.content = content;
        this.settings = settings;
    }
    create(principal, meta) {
        return this.adapter.create(meta);
    }
    list(principal, opts) {
        return this.adapter.list(opts);
    }
    update(principal, id, data) {
        return this.adapter.update(id, data);
    }
    load(principal, ids) {
        return this.adapter.load(ids);
    }
    findByHash(hashes) {
        return this.adapter.findByHash(hashes);
    }
    async delete(principal, id) {
        try {
            await this.adapter.delete(id, this.content.models);
        }
        catch (err) {
            if (err.type === "content") {
                err.refs = await this.content.findByMedia(id);
            }
            if (err.type === "settings") {
                const model = this.settings.getModel(err.model);
                if (model) {
                    const ref = await this.settings.findItem(principal, model, err.field, id);
                    err.refs = [ref];
                }
            }
            throw err;
        }
    }
}
exports.default = MediaPersistence;
//# sourceMappingURL=MediaPersistence.js.map