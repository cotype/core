import { Model, Principal } from "../../typings";
export declare enum Permission {
    "forbidden" = 0,
    "view" = 1,
    "edit" = 2,
    "publish" = 4
}
export declare function checkPermissions(principal: Principal, model: Model, action: number): void;
export declare function isAllowed(principal: Principal, model: Model, action: number): boolean;
