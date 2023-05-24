"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModelFilter = exports.includeModel = void 0;
function includeModel(model, permissions) {
    const { content } = permissions;
    const { name } = model;
    if (name in content) {
        return content[name] > 0;
    }
    return content["*"] > 0;
}
exports.includeModel = includeModel;
function createModelFilter(principal) {
    return (model) => includeModel(model, principal.permissions);
}
exports.createModelFilter = createModelFilter;
function filterModels(models, principal) {
    const { content, settings, media } = models;
    return {
        media,
        settings: principal.permissions.settings ? settings : [],
        content: content.filter(createModelFilter(principal))
    };
}
exports.default = filterModels;
//# sourceMappingURL=filterModels.js.map