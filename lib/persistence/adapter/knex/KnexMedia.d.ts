import * as Cotype from "../../../../typings";
import { Knex } from "knex";
import { MediaAdapter } from "..";
export default class KnexMedia implements MediaAdapter {
    knex: Knex;
    constructor(inputKnex: Knex);
    create(media: Cotype.Media): Promise<void>;
    list({ limit, offset, search, orderBy, order, mimetype, unUsed, used }: Cotype.MediaListOpts): Promise<Cotype.ListChunk<Cotype.Media>>;
    load(ids: string[]): Promise<Cotype.Media[]>;
    findByHash(hashes: string[]): Promise<Cotype.Media[]>;
    update(id: string, data: any): Promise<boolean>;
    delete(id: string, models: Cotype.Model[]): Promise<any>;
    createSearchString(name: string, tags: string[] | null): string;
}
