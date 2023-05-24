import { Model, Models, Principal, Permissions } from "../../typings";
export declare function includeModel(model: Model, permissions: Permissions): boolean;
export declare function createModelFilter(principal: Principal): (model: Model) => boolean;
export default function filterModels(models: Models, principal: Principal): {
    media: Model;
    settings: Model[];
    content: Model[];
};
