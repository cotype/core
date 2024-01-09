"use strict";
// Remove not allowed characters in MYSQL fulltext boolean search (https://dev.mysql.com/doc/refman/8.0/en/fulltext-boolean.html)
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(text) {
    return (text
        .replace(/[()<>~"*+-]/g, " ")
        .trim()
        .split(" ")
        .filter(w => !!w)
        .map(word => `+${word.trim()}*`)
        .join(", ") || "");
}
exports.default = default_1;
//# sourceMappingURL=cleanSearchTerm.js.map