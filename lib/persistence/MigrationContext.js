"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
class MigrationContext {
    constructor(content) {
        this.content = content;
    }
    rewrite(modelName, iterator) {
        return this.content.rewrite(modelName, iterator);
    }
    addField(modelName, fieldPath, defaultValue) {
        return this.rewrite(modelName, (data, meta) => __awaiter(this, void 0, void 0, function* () {
            const value = typeof defaultValue === "function"
                ? defaultValue(data, meta)
                : defaultValue;
            lodash_1.default.set(data, fieldPath, value);
            return data;
        }));
    }
    removeField(modelName, fieldPath) {
        return this.rewrite(modelName, (data) => __awaiter(this, void 0, void 0, function* () {
            lodash_1.default.unset(data, fieldPath);
            return data;
        }));
    }
}
exports.default = MigrationContext;
//# sourceMappingURL=MigrationContext.js.map