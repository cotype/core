// TODO Factor out as stand-alone npm module
/**
 * Convert quill documents into various formats.
 */
import { fromDelta } from "@slite/quill-delta-markdown";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
function plaintext(data) {
    if (!data)
        return "";
    return data.ops.reduce((text, op) => {
        if (typeof op.insert !== "string")
            return text + " ";
        return text + op.insert;
    }, "");
}
function html(delta) {
    const converter = new QuillDeltaToHtmlConverter(delta.ops);
    return converter.convert();
}
const formatters = {
    json: (data) => JSON.stringify(data),
    html: (data) => (data ? String(html(data)) : ""),
    markdown: (data) => (data ? String(fromDelta(data.ops)) : ""),
    plaintext
};
export const formats = Object.keys(formatters);
export default (data, format) => {
    const f = formatters[format];
    if (!f)
        throw new Error(`Invalid richtext format: ${format}`);
    /* In the case you switch from type `string` to type `richtext`
      data will be provided but not in the correct format.
      In the future such a problem should be solved with a data migration.
    */
    if (typeof data === "string")
        return data;
    return f(data);
};
//# sourceMappingURL=formatQuillDelta.js.map