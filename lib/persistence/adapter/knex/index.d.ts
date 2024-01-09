import { Knex } from "knex";
import { PersistenceAdapter } from "..";
type KnexSeedsConfig = Knex.SeederConfig & {
    directory: string;
    uploads?: string;
};
export type KnexConfig = Knex.Config & {
    migrate?: boolean;
    seeds?: KnexSeedsConfig;
};
export default function (userConfig: KnexConfig): Promise<PersistenceAdapter>;
export {};
