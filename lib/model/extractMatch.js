"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bm25_1 = __importDefault(require("./rankingFunctions/bm25"));
const ratcliffObershelp_1 = __importDefault(require("./rankingFunctions/ratcliffObershelp"));
/**
 * Recursively walks through a content object and extracts all texts.
 */
const visit_1 = __importDefault(require("./visit"));
const formatQuillDelta_1 = __importDefault(require("../content/formatQuillDelta"));
function extractMatch(obj, model, query, strictMode = true) {
    const sentences = [];
    function add(text) {
        if (typeof text !== "string")
            return;
        const s = text.replace(/[\n\s]+/g, " ");
        const re = /[^.?!]+.?/g;
        let m;
        do {
            m = re.exec(s);
            if (m)
                sentences.push(m[0].trim());
        } while (m);
    }
    (0, visit_1.default)(obj, model, {
        string(s, field, _parent, path) {
            if (s && field.search !== false && path !== model.title)
                add(s);
        },
        number(n, field) {
            if (field.search !== false && n !== undefined)
                add(String(n));
        },
        richtext(delta, field) {
            const text = (0, formatQuillDelta_1.default)(delta, "plaintext");
            if (text && field.search !== false)
                add(text);
        }
    });
    if (!query)
        return;
    let matches = (0, bm25_1.default)(sentences, query);
    if (matches && !!matches.length)
        return matches[0];
    matches = (0, ratcliffObershelp_1.default)(sentences, query, strictMode);
    if (matches && !!matches.length)
        return matches[0];
}
exports.default = extractMatch;
//# sourceMappingURL=extractMatch.js.map