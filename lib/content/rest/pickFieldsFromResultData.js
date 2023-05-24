"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pick_1 = __importDefault(require("lodash/pick"));
function pickFieldsFromResultData(unpickedData, fields) {
    if (!fields || !Array.isArray(fields) || !fields.length)
        return unpickedData;
    const pickNeededFields = (dataToPick) => (0, pick_1.default)(dataToPick, [...fields, "_id"]);
    let pickedData;
    if ("items" in unpickedData) {
        const pickedItems = unpickedData.items.map(item => {
            const data = pickNeededFields(item.data);
            return {
                ...item,
                data
            };
        });
        pickedData = {
            ...unpickedData,
            items: pickedItems,
            _refs: unpickedData._refs
        };
    }
    else {
        const data = pickNeededFields(unpickedData.data);
        pickedData = {
            ...unpickedData,
            data,
            _refs: unpickedData._refs
        };
    }
    return pickedData;
}
exports.default = pickFieldsFromResultData;
//# sourceMappingURL=pickFieldsFromResultData.js.map