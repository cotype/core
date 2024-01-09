import { Type } from "../../../../typings";
export declare function isDate(type: any): boolean;
export declare function isComparable(type: Type): boolean;
export declare function toNumber(value: any, type: Type): number | null;
export declare function serialize(value: any, type: Type): {
    literal: null;
    literal_lc: null;
    numeric?: undefined;
} | {
    literal: string;
    literal_lc: string;
    numeric: number | null;
} | {
    literal: string;
    literal_lc: string;
    numeric?: undefined;
};
