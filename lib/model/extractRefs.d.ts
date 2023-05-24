import * as Cotype from "../../typings";
type Ref = {
    content?: number;
    media?: string;
    fieldNames?: string;
    optional: boolean;
};
export default function extractRefs(obj: object, model: Cotype.Model, models: Cotype.Model[]): Ref[];
export {};
