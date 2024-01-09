/**
 * The part of the persistence layer that handles the content.
 */
import * as Cotype from "../../typings";
import { ContentAdapter } from "./adapter";
import { PersistenceConfig } from ".";
import { ContentFormat, Data, MetaData, Content, ListOpts, ListChunk } from "../../typings";
import MigrationContext from "./MigrationContext";
export type Migration = {
    name: string;
    execute(ctx: MigrationContext): Promise<any>;
};
export type RewriteDataIterator = (data: Data, meta: MetaData) => void | Data | Promise<Data>;
export default class ContentPersistence implements Cotype.VersionedDataSource {
    adapter: ContentAdapter;
    models: Cotype.Model[];
    config: PersistenceConfig;
    /** contentTypes is empty since this is the default/fallback implementation */
    contentTypes: string[];
    constructor(adapter: ContentAdapter, models: Cotype.Model[], config: PersistenceConfig);
    getModel(name: string): Cotype.Model | undefined;
    canView(principal?: Cotype.Principal): (item: {
        model: string;
    } | null) => item is any;
    applyPreHooks<T>(event: keyof Cotype.PreHooks, model: Cotype.Model, data: Cotype.Data): Promise<Cotype.Data>;
    applyPostHooks(event: keyof Cotype.PostHooks, model: Cotype.Model, dataRecord: Cotype.DataRecord): Promise<void>;
    createItem: (content: Cotype.Content) => Cotype.Item | null;
    createSearchResultItem: (content: Cotype.Content, term: string, external?: boolean) => Cotype.SearchResultItem | null;
    createItems(contents: Cotype.Content[], principal?: Cotype.Principal): Cotype.Item[];
    create(principal: Cotype.Principal, model: Cotype.Model, data: Cotype.Data, models: Cotype.Model[]): Promise<{
        id: string;
        data: Cotype.Data;
    }>;
    createRevision(principal: Cotype.Principal, model: Cotype.Model, id: string, data: object, models: Cotype.Model[]): Promise<{
        rev: number;
        data: Cotype.Data;
    }>;
    fetchRefs(ids: string[], contentFormat: ContentFormat, previewOpts: Cotype.PreviewOpts | undefined, join: Cotype.Join | undefined, model: Cotype.Model): Promise<Cotype.Refs>;
    load(principal: Cotype.Principal, model: Cotype.Model, id: string, join: Cotype.Join | undefined, contentFormat: ContentFormat, previewOpts?: Cotype.PreviewOpts): Promise<Cotype.ContentWithRefs | null>;
    loadInternal(principal: Cotype.Principal, model: Cotype.Model, id: string, previewOpts?: Cotype.PreviewOpts): Promise<Cotype.Content | null>;
    loadItem(principal: Cotype.Principal, model: Cotype.Model, id: string): Promise<Cotype.Item | null>;
    loadRevision(principal: Cotype.Principal, model: Cotype.Model, id: string, rev: number): Promise<Cotype.Revision>;
    listVersions(principal: Cotype.Principal, model: Cotype.Model, id: string): Promise<(Cotype.Item & Cotype.MetaData & {
        latest_rev: number;
        published_rev: boolean;
        author_name: string;
        date: string;
    } & {
        published: boolean;
    })[]>;
    update(principal: Cotype.Principal, model: Cotype.Model, id: string, data: object, models: Cotype.Model[]): Promise<{
        id: string;
        data: object;
    }>;
    schedule(principal: Cotype.Principal, model: Cotype.Model, id: string, schedule: Cotype.Schedule): Promise<void>;
    publishRevision(principal: Cotype.Principal, model: Cotype.Model, id: string, rev: number, models: Cotype.Model[]): Promise<void>;
    delete(principal: Cotype.Principal, model: Cotype.Model, id: string): Promise<any>;
    list(principal: Cotype.Principal, model: Cotype.Model, opts: Cotype.ListOpts, criteria?: Cotype.Criteria): Promise<Cotype.ListChunk<Cotype.Item>>;
    findByMedia(media: string): Promise<Cotype.Item[]>;
    find(principal: Cotype.Principal, model: Cotype.Model, opts: Cotype.ListOpts, contentFormat: Cotype.ContentFormat, join: Cotype.Join, criteria?: Cotype.Criteria, previewOpts?: Cotype.PreviewOpts): Promise<Cotype.ListChunkWithRefs<Cotype.Content>>;
    findInternal(principal: Cotype.Principal, model: Cotype.Model, opts: Cotype.ListOpts, criteria?: Cotype.Criteria, previewOpts?: Cotype.PreviewOpts): Promise<Cotype.ListChunk<Cotype.Content>>;
    search(principal: Cotype.Principal, term: string, exact: boolean, opts: Cotype.ListOpts, previewOpts?: Cotype.PreviewOpts): Promise<Cotype.ListChunk<Cotype.SearchResultItem>>;
    externalSearch(principal: Cotype.Principal, term: string, opts: Cotype.ListOpts, previewOpts?: Cotype.PreviewOpts): Promise<Cotype.ListChunk<Cotype.SearchResultItem>>;
    suggest(principal: Cotype.Principal, term: string, previewOpts?: Cotype.PreviewOpts): Promise<string[]>;
    rewrite(modelName: string, iterator: RewriteDataIterator): Promise<void>;
    migrate(migrations: Migration[]): void;
    createItemsWithAuthorAndDate: (listChunk: ListChunk<Content>) => {
        date: string | Date;
        author_name: string;
        id: string;
        type: string;
        model: string;
        title: string;
        image?: string | undefined;
        kind: string;
        childCount?: string | undefined;
        orderValue?: string | undefined;
    }[];
    listLastUpdatedContent(principal: Cotype.Principal, opts?: ListOpts, byUser?: boolean): Promise<{
        total: number;
        items: {
            date: string | Date;
            author_name: string;
            id: string;
            type: string;
            model: string;
            title: string;
            image?: string | undefined;
            kind: string;
            childCount?: string | undefined;
            orderValue?: string | undefined;
        }[];
    }>;
    listUnpublishedContent(principal: Cotype.Principal, opts: ListOpts): Promise<{
        total: number;
        items: {
            date: string | Date;
            author_name: string;
            id: string;
            type: string;
            model: string;
            title: string;
            image?: string | undefined;
            kind: string;
            childCount?: string | undefined;
            orderValue?: string | undefined;
        }[];
    }>;
    private processReferenceConflictError;
    private setOrderPosition;
    private splitStoreAndIndexData;
}
