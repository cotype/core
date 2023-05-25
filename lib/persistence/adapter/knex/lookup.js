export function isDate(type) {
    return type.input === "date";
}
export function isComparable(type) {
    return type.type === "number" || isDate(type);
}
export function toNumber(value, type) {
    if (type.type === "number")
        return Number(value);
    if (isDate(type))
        return new Date(isNaN(value) ? value : Number(value)).getTime();
    return null;
}
export function serialize(value, type) {
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
//# sourceMappingURL=lookup.js.map