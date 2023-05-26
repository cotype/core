"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const builder_1 = __importDefault(require("./builder"));
const media_1 = __importDefault(require("./media"));
const settings_1 = __importDefault(require("./settings"));
function default_1(contentModels, externalDataSource) {
    const content = (0, builder_1.default)({ type: "content", versioned: true, writable: true }, externalDataSource)(contentModels);
    const settings = (0, builder_1.default)({ type: "settings", writable: true })(settings_1.default);
    const [media] = (0, builder_1.default)({ type: "media" })(media_1.default);
    return {
        content,
        settings,
        media
    };
}
exports.default = default_1;
//# sourceMappingURL=index.js.map