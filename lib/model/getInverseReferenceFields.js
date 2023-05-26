"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const visit_1 = __importDefault(require("./visit"));
const getInverseReferenceFields = (model) => {
    const referenceFields = [];
    (0, visit_1.default)({}, model, {
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
exports.default = getInverseReferenceFields;
//# sourceMappingURL=getInverseReferenceFields.js.map