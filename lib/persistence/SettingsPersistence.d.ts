import * as Cotype from "../../typings";
import { SettingsAdapter } from "./adapter";
export default class SettingsPersistence {
    adapter: SettingsAdapter;
    models: Cotype.Model[];
    applyHooks: (...args: any[]) => any;
    constructor(adapter: SettingsAdapter, models: Cotype.Model[]);
    getModel(name: string): Cotype.Model | undefined;
    create(principal: Cotype.Principal, model: Cotype.Model, data: object): any;
    load(principal: Cotype.Principal, model: Cotype.Model, id: string): Promise<Cotype.Settings>;
    find(principal: Cotype.Principal, model: Cotype.Model, field: string, value: any): Promise<Cotype.Settings>;
    findItem(principal: Cotype.Principal, model: Cotype.Model, field: string, value: any): Promise<Cotype.Item>;
    loadItem(principal: Cotype.Principal, model: Cotype.Model, id: string): Promise<Cotype.Item>;
    list(principal: Cotype.Principal, model: Cotype.Model, opts: Cotype.ListOpts): Promise<Cotype.ListChunk<Cotype.Item>>;
    update(principal: Cotype.Principal, model: Cotype.Model, id: string, data: object): Promise<Cotype.Settings>;
    delete(principal: Cotype.Principal, model: Cotype.Model, id: string): Promise<any>;
    loadUser(id: string): Promise<Cotype.User>;
    findUserByEmail(email: string): Promise<Cotype.Settings>;
}
