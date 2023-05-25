/**
 * Recursively walks through a content object and extracts all texts.
 */
import visit from "./visit";
import formatQuillDelta from "../content/formatQuillDelta";
export default function extractText(obj, model) {
    const tokens = [];
    visit(obj, model, {
        string(s, field) {
            if (s && field.search !== false)
                tokens.push(s);
        },
        number(n, field) {
            if (field.search !== false)
                tokens.push(String(n));
        },
        richtext(delta, field) {
            const text = formatQuillDelta(delta, "plaintext");
            if (text && field.search !== false)
                tokens.push(text);
        }
    });
    return tokens.join(" ");
}
//# sourceMappingURL=extractText.js.map