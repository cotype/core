import visit from "./visit";
const getInverseReferenceFields = (model) => {
    const referenceFields = [];
    visit({}, model, {
        references(_value, field, _parent, path) {
            if (path)
                referenceFields.push({
                    path,
                    model: field.model,
                    fieldName: field.fieldName
                });
        }
    });
    return referenceFields;
};
export default getInverseReferenceFields;
//# sourceMappingURL=getInverseReferenceFields.js.map