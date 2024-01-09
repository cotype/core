"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiWriteHelpers = exports.createApiReadHelpers = void 0;
const qs_1 = require("qs");
function createApiReadHelpers(server) {
    const list = async (type, params = {}, published = true) => {
        const { body } = await server
            .get(`/rest/${published ? "published" : "drafts"}/${type}?${(0, qs_1.stringify)(params)}`)
            .expect(200);
        return body;
    };
    const find = async (type, id, params = {}, published = true) => {
        const { body } = await server
            .get(`/rest/${published ? "published" : "drafts"}/${type}/${id}?${(0, qs_1.stringify)(params)}`)
            .expect(200);
        return body;
    };
    const search = async (term, opts) => {
        const { published = true, linkableOnly = true, includeModels = [], excludeModels = [], limit = 50, offset = 0 } = opts;
        const { body } = await server
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
    };
    const suggest = async (term, opts) => {
        const { published = true, linkableOnly = true, includeModels = [], excludeModels = [] } = opts;
        const { body } = await server
            .get(`/rest/${published ? "published" : "drafts"}/search/suggest?${(0, qs_1.stringify)({
            term,
            linkableOnly,
            includeModels,
            excludeModels
        })}`)
            .expect(200);
        return body;
    };
    const findByField = async (type, field, value, params = {}, published = true) => {
        const { body } = await server
            .get(`/rest/${published ? "published" : "drafts"}/${type}/${field}/${value}?${(0, qs_1.stringify)(params)}`)
            .expect(200);
        return body;
    };
    return { find, list, search, findByField, suggest };
}
exports.createApiReadHelpers = createApiReadHelpers;
function createApiWriteHelpers(server, headers) {
    const create = async (type, data) => {
        const { body } = await server
            .post(`/admin/rest/content/${type}`)
            .set(headers)
            .send({ data })
            .expect(200);
        return body;
    };
    const update = async (type, id, data) => {
        const { body } = await server
            .put(`/admin/rest/content/${type}/${id}`)
            .set(headers)
            .send(data)
            .expect(200);
        return body;
    };
    const schedule = async (type, id, data) => {
        const { body } = await server
            .post(`/admin/rest/content/${type}/${id}/schedule`)
            .set(headers)
            .send(data)
            .expect(204);
        return body;
    };
    const publish = async (type, id) => server
        .post(`/admin/rest/content/${type}/${id}/publish`)
        .set(headers)
        .send({ rev: 1 })
        .expect(204);
    return { create, update, schedule, publish };
}
exports.createApiWriteHelpers = createApiWriteHelpers;
//# sourceMappingURL=apiHelper.js.map