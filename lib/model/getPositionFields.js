import visit from "./visit";
const getPositionFields = (model) => {
    const uniqueFields = [];
    visit({}, model, {
        position(s, f, d, stringPath) {
            if (stringPath)
                uniqueFields.push(stringPath);
        }
    });
    return uniqueFields;
};
export default getPositionFields;
export const getPositionFieldsWithValue = (data, model) => {
    const fields = [];
    visit(data, model, {
        position(s, f, d, stringPath) {
            if (stringPath)
                fields.push({
                    value: s,
                    fieldPath: stringPath
                });
        }
    });
    return fields;
};
//# sourceMappingURL=getPositionFields.js.map