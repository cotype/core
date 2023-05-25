/**
 * Visitor to recursively walk through a content object.
 */
import _ from "lodash";
export default function visit(obj, model, visitor) {
    if (!obj)
        return;
    const walk = (m, value, key, parent) => {
        if (!m)
            return;
        if (m.type === "object") {
            Object.keys(m.fields).forEach(fieldKey => walk(m.fields[fieldKey], (value || {})[fieldKey], fieldKey, value));
        }
        if (m.type === "list") {
            if (Array.isArray(value))
                value.forEach((item, i) => walk(m.item, item, String(i), value));
        }
        if (m.type === "union") {
            if (value) {
                const { _type } = value;
                walk(m.types[_type], value);
            }
        }
        if (m.type in visitor) {
            const ret = visitor[m.type](value, m);
            if (typeof ret !== "undefined") {
                if (parent && key)
                    _.set(parent, key, ret);
            }
        }
    };
    Object.keys(model.fields).forEach(key => walk(model.fields[key], obj[key] || (obj.data && obj.data[key]), key, obj));
}
//# sourceMappingURL=visit.js.map