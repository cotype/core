"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchableModelNames = exports.linkableAndSearchableModelNames = exports.linkableModelNames = void 0;
// all models that have their own page
function linkableModelNames(models) {
    return models.filter(m => !!m.urlPath).map(m => m.name);
}
exports.linkableModelNames = linkableModelNames;
// all models that have their own page and not excluded from search
function linkableAndSearchableModelNames(models) {
    return models.filter(m => !m.notSearchAble && m.urlPath).map(m => m.name);
}
exports.linkableAndSearchableModelNames = linkableAndSearchableModelNames;
// all models that are not specifically excluded from search
function searchableModelNames(models) {
    return models.filter(m => !m.notSearchAble).map(m => m.name);
}
exports.searchableModelNames = searchableModelNames;
//# sourceMappingURL=utils.js.map