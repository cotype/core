"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Recursively walks through a content object and extracts all texts.
 */
const visit_1 = __importDefault(require("./visit"));
const formatQuillDelta_1 = __importDefault(require("../content/formatQuillDelta"));
function extractText(obj, model) {
    const tokens = [];
    (0, visit_1.default)(obj, model, {
        string(s, field) {
            if (s && field.search !== false)
                tokens.push(s);
        },
        number(n, field) {
            if (field.search !== false)
                tokens.push(String(n));
        },
        richtext(delta, field) {
            const text = (0, formatQuillDelta_1.default)(delta, "plaintext");
            if (text && field.search !== false)
                tokens.push(text);
        }
    });
    return tokens.join(" ");
}
exports.default = extractText;
//# sourceMappingURL=extractText.js.map