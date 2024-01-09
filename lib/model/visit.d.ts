import * as Cotype from "../../typings";
export declare const NO_STORE_VALUE: unique symbol;
type Visitor = {
    [key: string]: (value: any, field: any, deleteFunc: () => void, stringPath: string) => void | typeof NO_STORE_VALUE | any;
};
export default function visit(obj: any, model: Cotype.Model, visitor: Visitor, options?: {
    flattenList?: boolean;
}): void;
export {};
