export function includeModel(model, permissions) {
    const { content } = permissions;
    const { name } = model;
    if (name in content) {
        return content[name] > 0;
    }
    return content["*"] > 0;
}
export function createModelFilter(principal) {
    return (model) => includeModel(model, principal.permissions);
}
export default function filterModels(models, principal) {
    const { content, settings, media } = models;
    return {
        media,
        settings: principal.permissions.settings ? settings : [],
        content: content.filter(createModelFilter(principal))
    };
}
//# sourceMappingURL=filterModels.js.map