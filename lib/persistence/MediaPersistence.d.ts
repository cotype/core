/**
 * The part of the persistence layer that handles media assets.
 */
import * as Cotype from "../../typings";
import { MediaAdapter } from "./adapter";
import ContentPersistence from "./ContentPersistence";
import SettingsPersistence from "./SettingsPersistence";
export default class MediaPersistence {
    adapter: MediaAdapter;
    content: ContentPersistence;
    settings: SettingsPersistence;
    constructor(adapter: MediaAdapter, content: ContentPersistence, settings: SettingsPersistence);
    create(principal: Cotype.Principal, meta: Cotype.Meta): Promise<void>;
    list(principal: Cotype.Principal, opts: Cotype.MediaListOpts): Promise<Cotype.ListChunk<Cotype.Media>>;
    update(principal: Cotype.Principal, id: string, data: Cotype.Media): Promise<boolean>;
    load(principal: Cotype.Principal, ids: string[]): Promise<Cotype.Media[]>;
    findByHash(hashes: string[]): Promise<Cotype.Media[]>;
    delete(principal: Cotype.Principal, id: string): Promise<void>;
}
