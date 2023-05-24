"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
class MigrationContext {
    content;
    constructor(content) {
        this.content = content;
    }
    rewrite(modelName, iterator) {
        return this.content.rewrite(modelName, iterator);
    }
    addField(modelName, fieldPath, defaultValue) {
        return this.rewrite(modelName, async (data, meta) => {
            const value = typeof defaultValue === "function"
                ? defaultValue(data, meta)
                : defaultValue;
            lodash_1.default.set(data, fieldPath, value);
            return data;
        });
    }
    removeField(modelName, fieldPath) {
        return this.rewrite(modelName, async (data) => {
            lodash_1.default.unset(data, fieldPath);
            return data;
        });
    }
}
exports.default = MigrationContext;
//# sourceMappingURL=MigrationContext.js.map