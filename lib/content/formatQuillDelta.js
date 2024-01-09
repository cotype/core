"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formats = void 0;
// TODO Factor out as stand-alone npm module
/**
 * Convert quill documents into various formats.
 */
const quill_delta_markdown_1 = require("@slite/quill-delta-markdown");
const quill_delta_to_html_1 = require("quill-delta-to-html");
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
    const converter = new quill_delta_to_html_1.QuillDeltaToHtmlConverter(delta.ops);
    return converter.convert();
}
const formatters = {
    json: (data) => JSON.stringify(data),
    html: (data) => (data ? String(html(data)) : ""),
    markdown: (data) => (data ? String((0, quill_delta_markdown_1.fromDelta)(data.ops)) : ""),
    plaintext
};
exports.formats = Object.keys(formatters);
exports.default = (data, format) => {
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