import { Type } from "../../../../typings";

export function isDate(type: any) {
  return type.input === "date";
}

export function isComparable(type: Type) {
  return type.type === "number" || isDate(type);
}

export function toNumber(value: any, type: Type) {
  if (type.type === "number") return Number(value);
  if (isDate(type))
    return new Date(isNaN(value) ? value : Number(value)).getTime();
  return null;
}

export function serialize(value: any, type: Type) {
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
