/**
 * The persistence layer. Access to any underlying datasource is
 * routed through this class and handed over to an adapter.
 * NOTE: Currently there is only an adapter for relational databases.
 * Adding other storage backends like elasticsearch or mongodb is possible.
 *
 */
import { Models, ContentHooks } from "../../typings";
import { PersistenceAdapter } from "./adapter";
import SettingsPersistence from "./SettingsPersistence";
import ContentPersistence from "./ContentPersistence";
import MediaPersistence from "./MediaPersistence";
export type PersistenceConfig = {
    basePath: string;
    mediaUrl: string;
    contentHooks?: ContentHooks;
    migrationDir?: string;
};
export declare class Persistence {
    adapter: PersistenceAdapter;
    settings: SettingsPersistence;
    content: ContentPersistence;
    media: MediaPersistence;
    constructor(models: Models, adapter: PersistenceAdapter, config: PersistenceConfig);
    init(): Promise<void>;
    migrate(dir: string): Promise<void>;
    shutdown(): void | Promise<any>;
}
export default function createPersistence(models: Models, adapter: PersistenceAdapter, config: PersistenceConfig): Promise<Persistence>;
