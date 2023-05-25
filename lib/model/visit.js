/**
 * Visitor to recursively walk through a content object.
 */
import _ from "lodash";
export const NO_STORE_VALUE = Symbol();
export default function visit(obj, model, visitor, options) {
    const opts = Object.assign({ flattenList: true }, options);
    if (!obj)
        return;
    const walk = (m, value, key, parent, stringPath = "") => {
        if (!m)
            return;
        if (m.type === "object") {
            Object.keys(m.fields).forEach(fieldKey => walk(m.fields[fieldKey], (value || {})[fieldKey], fieldKey, value, stringPath + key + "."));
        }
        if (m.type === "list" && opts.flattenList) {
            if (Array.isArray(value))
                value.forEach((item, i) => walk(m.item, item.value, String(i), value, stringPath + key + "."));
        }
        if (m.type === "union") {
            if (value) {
                const { _type } = value;
                walk(m.types[_type], value, undefined, undefined, stringPath + key + ".");
            }
        }
        if (m.type === "immutable") {
            walk(m.child, value, key, parent, stringPath);
        }
        if (m.type in visitor) {
            const ret = visitor[m.type](value, m, () => {
                if (parent && key) {
                    _.set(parent, key, undefined);
                }
            }, Array.isArray(parent) ? stringPath.slice(0, -1) : stringPath + key // Remove Dot and ArrayKey when Parent is List
            );
            if (typeof ret !== "undefined") {
                if (parent && key) {
                    if (ret === NO_STORE_VALUE) {
                        return _.set(parent, key, undefined);
                    }
                    _.set(parent, key, ret);
                }
            }
        }
    };
    Object.keys(model.fields).forEach(key => walk(model.fields[key], obj[key] || (obj.data && obj.data[key]), key, obj));
}
//# sourceMappingURL=visit.js.map