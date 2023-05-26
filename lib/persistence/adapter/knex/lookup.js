"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = exports.toNumber = exports.isComparable = exports.isDate = void 0;
function isDate(type) {
    return type.input === "date";
}
exports.isDate = isDate;
function isComparable(type) {
    return type.type === "number" || isDate(type);
}
exports.isComparable = isComparable;
function toNumber(value, type) {
    if (type.type === "number")
        return Number(value);
    if (isDate(type))
        return new Date(isNaN(value) ? value : Number(value)).getTime();
    return null;
}
exports.toNumber = toNumber;
function serialize(value, type) {
    if (value === null || value === undefined) {
        return { literal: null, literal_lc: null };
    }
    const literal = String(value).slice(0, 255);
    const literalLc = literal.toLowerCase();
    if (isComparable(type) && value !== "") {
        return {
            literal,
            literal_lc: literalLc,
            numeric: toNumber(value, type)
        };
    }
    return { literal, literal_lc: literalLc };
}
exports.serialize = serialize;
//# sourceMappingURL=lookup.js.map