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
Object.defineProperty(exports, "__esModule", { value: true });
class MediaPersistence {
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
    delete(principal, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.adapter.delete(id, this.content.models);
            }
            catch (err) {
                if (err.type === "content") {
                    err.refs = yield this.content.findByMedia(id);
                }
                if (err.type === "settings") {
                    const model = this.settings.getModel(err.model);
                    if (model) {
                        const ref = yield this.settings.findItem(principal, model, err.field, id);
                        err.refs = [ref];
                    }
                }
                throw err;
            }
        });
    }
}
exports.default = MediaPersistence;
//# sourceMappingURL=MediaPersistence.js.map