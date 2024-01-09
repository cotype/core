import * as Cotype from "../../../typings";
type Visitor = {
    [key: string]: (value: any, field: any) => void;
};
export default function visit(obj: any, model: Cotype.Model, visitor: Visitor): void;
export {};
