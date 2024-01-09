import { Model, Models, NavigationOpts, NavigationItem } from "../../typings";
type ModelFilter = (model: Model) => boolean;
type ModelPaths = {
    [key: string]: string;
};
type Info = {
    modelPaths: {
        content: ModelPaths;
    };
    navigation: NavigationItem[];
};
export declare function buildInfo(navigation: NavigationOpts[], models: Models, isAllowed: ModelFilter): Info;
export {};
