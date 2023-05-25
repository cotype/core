import visit from "../model/visit";
/**
 * Filters Request
 */
export default function removeDeprecatedData(obj, model, internal) {
    visit(obj, model, {
        // Remove falsy list items.
        list(list) {
            return list && Array.isArray(list) && list.filter(Boolean);
        },
        // Remove items with an unknown _type
        union(data, field) {
            if (data && !Object.keys(field.types).includes(data._type))
                return null;
        }
    });
    return obj;
}
//# sourceMappingURL=removeDeprecatedData.js.map