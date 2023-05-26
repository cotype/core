"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPositionFieldsWithValue = void 0;
const visit_1 = __importDefault(require("./visit"));
const getPositionFields = (model) => {
    const uniqueFields = [];
    (0, visit_1.default)({}, model, {
        position(s, f, d, stringPath) {
            if (stringPath)
                uniqueFields.push(stringPath);
        }
    });
    return uniqueFields;
};
exports.default = getPositionFields;
const getPositionFieldsWithValue = (data, model) => {
    const fields = [];
    (0, visit_1.default)(data, model, {
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
exports.getPositionFieldsWithValue = getPositionFieldsWithValue;
//# sourceMappingURL=getPositionFields.js.map