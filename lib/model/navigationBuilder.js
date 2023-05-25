function isNotNull(x) {
    return x !== null;
}
function getModelItemPath(item) {
    return item.path || item.model.replace(/[^a-zA-Z]*/g, "");
}
function getGroupItemPath(item) {
    return item.path || item.name.replace(/[^a-zA-Z]*/g, "");
}
function modelToItem(m) {
    return {
        type: "model",
        model: m.name,
        name: m.plural,
        path: m.name
    };
}
export function buildInfo(navigation, models, isAllowed) {
    const contentModels = models.content;
    const contentModelPaths = {};
    const usedModels = [];
    const builtModelItem = (item, basePath = "") => {
        if (!item.model)
            throw new Error(`Item must have a model: ${item.name}`);
        const model = contentModels.find(m => m.name === item.model);
        if (!model)
            throw new Error(`Unknown model "${item.model}" in navigation.`);
        if (!isAllowed(model))
            return null;
        const path = `${basePath}/${getModelItemPath(item)}`;
        contentModelPaths[model.name] = path;
        usedModels.push(model);
        const name = model.collection === "singleton" ? model.singular : model.plural;
        return Object.assign(Object.assign({ name }, item), { path });
    };
    const buildGroupItem = (group, basePath = "") => {
        if (group.type !== "group")
            throw new Error(`Invalid item type: ${group.type}`);
        if (!group.items)
            throw new Error(`Group ${group.name} must not be empty`);
        const path = basePath ? basePath : `/${getGroupItemPath(group)}`;
        const filteredItems = group.items
            .map(i => buildItem(i, path))
            .filter(isNotNull);
        if (!filteredItems.length)
            return null;
        return Object.assign(Object.assign({}, group), { path, items: filteredItems });
    };
    const buildItem = (item, basePath = "") => {
        return item.type === "model"
            ? builtModelItem(item, basePath)
            : buildGroupItem(item, basePath);
    };
    const isUsed = (m) => usedModels.includes(m);
    const isVisible = (m) => m.collection !== "none";
    const buildDefaultGroup = () => {
        const remainingModels = contentModels.filter(m => !isUsed(m) && isVisible(m));
        return buildGroupItem({
            type: "group",
            name: "Content",
            path: "content",
            items: remainingModels.map(modelToItem)
        });
    };
    const filteredNavigation = navigation
        .map(i => buildItem(i))
        .concat(buildDefaultGroup())
        .filter(isNotNull);
    return {
        navigation: filteredNavigation,
        modelPaths: {
            content: contentModelPaths
        }
    };
}
//# sourceMappingURL=navigationBuilder.js.map