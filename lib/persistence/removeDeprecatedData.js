"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const visit_1 = __importDefault(require("../model/visit"));
/**
 * Filters Request
 */
function removeDeprecatedData(obj, model, internal) {
    (0, visit_1.default)(obj, model, {
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
exports.default = removeDeprecatedData;
//# sourceMappingURL=removeDeprecatedData.js.map