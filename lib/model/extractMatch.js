import bm25BestMatch from "./rankingFunctions/bm25";
import ratcliffObershelpBestMatch from "./rankingFunctions/ratcliffObershelp";
/**
 * Recursively walks through a content object and extracts all texts.
 */
import visit from "./visit";
import formatQuillDelta from "../content/formatQuillDelta";
export default function extractMatch(obj, model, query, strictMode = true) {
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
    visit(obj, model, {
        string(s, field, _parent, path) {
            if (s && field.search !== false && path !== model.title)
                add(s);
        },
        number(n, field) {
            if (field.search !== false && n !== undefined)
                add(String(n));
        },
        richtext(delta, field) {
            const text = formatQuillDelta(delta, "plaintext");
            if (text && field.search !== false)
                add(text);
        }
    });
    if (!query)
        return;
    let matches = bm25BestMatch(sentences, query);
    if (matches && !!matches.length)
        return matches[0];
    matches = ratcliffObershelpBestMatch(sentences, query, strictMode);
    if (matches && !!matches.length)
        return matches[0];
}
//# sourceMappingURL=extractMatch.js.map