"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_STORE_VALUE = void 0;
/**
 * Visitor to recursively walk through a content object.
 */
const lodash_1 = __importDefault(require("lodash"));
exports.NO_STORE_VALUE = Symbol();
function visit(obj, model, visitor, options) {
    const opts = {
        flattenList: true,
        ...options
    };
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
                    lodash_1.default.set(parent, key, undefined);
                }
            }, Array.isArray(parent) ? stringPath.slice(0, -1) : stringPath + key // Remove Dot and ArrayKey when Parent is List
            );
            if (typeof ret !== "undefined") {
                if (parent && key) {
                    if (ret === exports.NO_STORE_VALUE) {
                        return lodash_1.default.set(parent, key, undefined);
                    }
                    lodash_1.default.set(parent, key, ret);
                }
            }
        }
    };
    Object.keys(model.fields).forEach(key => walk(model.fields[key], obj[key] || (obj.data && obj.data[key]), key, obj));
}
exports.default = visit;
//# sourceMappingURL=visit.js.map