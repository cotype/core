"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getAlwaysUniqueFields_1 = __importDefault(require("./getAlwaysUniqueFields"));
const visit_1 = __importDefault(require("./visit"));
/**
 * Recursively walks through a content object and extracts all texts.
 */
const scalars = ["string", "number", "boolean", "position"];
const extractValues = (obj, model) => {
    const values = {};
    const uniqueFields = [
        ...(0, getAlwaysUniqueFields_1.default)(model),
        model.title,
        model.orderBy
    ];
    const setValue = (path, value, index) => {
        if (!index && !uniqueFields.includes(path)) {
            return;
        }
        if (typeof value === "undefined") {
            return;
        }
        values[path] = value;
    };
    (0, visit_1.default)(obj, model, {
        string(s, field, d, stringPath) {
            setValue(stringPath, s, field.index);
        },
        number(s, field, d, stringPath) {
            setValue(stringPath, s, field.index);
        },
        boolean(s, field, d, stringPath) {
            setValue(stringPath, !!s, field.index);
        },
        position(s, field, d, stringPath) {
            setValue(stringPath, s, field.index);
        },
        list(arr, field, d, stringPath) {
            if (!arr || arr.length === 0) {
                setValue(stringPath, "null", field.item.index);
            }
            else if (scalars.includes(field.item.type)) {
                setValue(stringPath, arr.map((el) => el.value), field.item.index);
            }
            else if (field.item.type === "content") {
                setValue(stringPath, arr.map((el) => el.value && el.value.id).filter(Boolean), field.item.index);
            }
            else if (field.item.type === "object") {
                arr.forEach((el) => {
                    const objectValues = {};
                    Object.entries(el.value).forEach(([key, v]) => {
                        const t = (field.item.fields[key] || {}).type;
                        if (!t)
                            return;
                        let value = null;
                        if (scalars.includes(t))
                            value = v;
                        if (v && t === "content")
                            value = v.id;
                        const n = `${stringPath}.${key}`;
                        if (!objectValues[n]) {
                            objectValues[n] = [];
                        }
                        objectValues[n].push({
                            value,
                            index: field.item.fields[key].index
                        });
                    });
                    Object.entries(objectValues).forEach(([path, args]) => setValue(path, args.map(v => v.value), args[0].index));
                });
            }
        }
    }, { flattenList: false });
    return values;
};
exports.default = extractValues;
//# sourceMappingURL=extractValues.js.map