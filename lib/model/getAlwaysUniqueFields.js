import visit from "./visit";
const getAlwaysUniqueFields = (model, noPositionFields) => {
    const uniqueFields = [...(model.uniqueFields || [])];
    visit({}, model, {
        position(s, f, d, stringPath) {
            if (stringPath && !noPositionFields)
                uniqueFields.push(stringPath);
        }
    });
    return uniqueFields;
};
export default getAlwaysUniqueFields;
//# sourceMappingURL=getAlwaysUniqueFields.js.map