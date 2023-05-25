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
exports.createApiWriteHelpers = exports.createApiReadHelpers = void 0;
const qs_1 = require("qs");
function createApiReadHelpers(server) {
    const list = (type, params = {}, published = true) => __awaiter(this, void 0, void 0, function* () {
        const { body } = yield server
            .get(`/rest/${published ? "published" : "drafts"}/${type}?${(0, qs_1.stringify)(params)}`)
            .expect(200);
        return body;
    });
    const find = (type, id, params = {}, published = true) => __awaiter(this, void 0, void 0, function* () {
        const { body } = yield server
            .get(`/rest/${published ? "published" : "drafts"}/${type}/${id}?${(0, qs_1.stringify)(params)}`)
            .expect(200);
        return body;
    });
    const search = (term, opts) => __awaiter(this, void 0, void 0, function* () {
        const { published = true, linkableOnly = true, includeModels = [], excludeModels = [], limit = 50, offset = 0 } = opts;
        const { body } = yield server
            .get(`/rest/${published ? "published" : "drafts"}/search/content?${(0, qs_1.stringify)({
            term,
            limit,
            offset,
            linkableOnly,
            includeModels,
            excludeModels
        })}`)
            .expect(200);
        return body;
    });
    const suggest = (term, opts) => __awaiter(this, void 0, void 0, function* () {
        const { published = true, linkableOnly = true, includeModels = [], excludeModels = [] } = opts;
        const { body } = yield server
            .get(`/rest/${published ? "published" : "drafts"}/search/suggest?${(0, qs_1.stringify)({
            term,
            linkableOnly,
            includeModels,
            excludeModels
        })}`)
            .expect(200);
        return body;
    });
    const findByField = (type, field, value, params = {}, published = true) => __awaiter(this, void 0, void 0, function* () {
        const { body } = yield server
            .get(`/rest/${published ? "published" : "drafts"}/${type}/${field}/${value}?${(0, qs_1.stringify)(params)}`)
            .expect(200);
        return body;
    });
    return { find, list, search, findByField, suggest };
}
exports.createApiReadHelpers = createApiReadHelpers;
function createApiWriteHelpers(server, headers) {
    const create = (type, data) => __awaiter(this, void 0, void 0, function* () {
        const { body } = yield server
            .post(`/admin/rest/content/${type}`)
            .set(headers)
            .send({ data })
            .expect(200);
        return body;
    });
    const update = (type, id, data) => __awaiter(this, void 0, void 0, function* () {
        const { body } = yield server
            .put(`/admin/rest/content/${type}/${id}`)
            .set(headers)
            .send(data)
            .expect(200);
        return body;
    });
    const schedule = (type, id, data) => __awaiter(this, void 0, void 0, function* () {
        const { body } = yield server
            .post(`/admin/rest/content/${type}/${id}/schedule`)
            .set(headers)
            .send(data)
            .expect(204);
        return body;
    });
    const publish = (type, id) => __awaiter(this, void 0, void 0, function* () {
        return server
            .post(`/admin/rest/content/${type}/${id}/publish`)
            .set(headers)
            .send({ rev: 1 })
            .expect(204);
    });
    return { create, update, schedule, publish };
}
exports.createApiWriteHelpers = createApiWriteHelpers;
//# sourceMappingURL=apiHelper.js.map