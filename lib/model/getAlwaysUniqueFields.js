"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const visit_1 = __importDefault(require("./visit"));
const getAlwaysUniqueFields = (model, noPositionFields) => {
    const uniqueFields = [...(model.uniqueFields || [])];
    (0, visit_1.default)({}, model, {
        position(s, f, d, stringPath) {
            if (stringPath && !noPositionFields)
                uniqueFields.push(stringPath);
        }
    });
    return uniqueFields;
};
exports.default = getAlwaysUniqueFields;
//# sourceMappingURL=getAlwaysUniqueFields.js.map