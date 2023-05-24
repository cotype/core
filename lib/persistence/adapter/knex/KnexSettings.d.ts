import { Model, ListOpts } from "../../../../typings";
import { Knex } from "knex";
import { SettingsAdapter } from "..";
export default class KnexSettings implements SettingsAdapter {
    knex: Knex;
    constructor(inputKnex: Knex);
    table(model: Model): Knex.QueryBuilder<any, {
        _base: any;
        _hasSelection: false;
        _keys: never;
        _aliases: {};
        _single: false;
        _intersectProps: {};
        _unionProps: never;
    }[]>;
    create(model: Model, data: object): Promise<any>;
    load(model: Model, id: string): Promise<any>;
    find(model: Model, field: string, value: any): Promise<any>;
    list(model: Model, opts: ListOpts): Promise<{
        total: number;
        items: any[];
    }>;
    update(model: Model, id: string, data: object): Promise<void>;
    delete(model: Model, id: string): Promise<number>;
    deleteUser(id: string): Promise<void>;
    loadUser(id: string): Promise<any>;
    findUserByEmail(email: string): Promise<any>;
    private deserializeUser;
    private stringify;
    private parse;
    private getJsonProps;
    private serialize;
    private deserialize;
}
