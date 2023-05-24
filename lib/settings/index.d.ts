import { Models } from "../../typings";
import { Router } from "express";
import { Persistence } from "../persistence";
declare const _default: (persistence: Persistence, models: Models) => {
    describe(api: any): void;
    routes(router: Router): void;
};
export default _default;
