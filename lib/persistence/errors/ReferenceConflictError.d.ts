import { Item } from "../../../typings";
type Opts = {
    type: "content" | "settings";
    model?: string;
    field?: string;
};
export default class ReferenceConflictError extends Error {
    type: string | undefined;
    model: string | undefined;
    field: string | undefined;
    refs?: Item[] | object[];
    constructor(opts?: Opts);
}
export {};
