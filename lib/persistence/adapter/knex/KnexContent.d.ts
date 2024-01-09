import * as Cotype from "../../../../typings";
import { Knex } from "knex";
import { ContentAdapter, RewriteIterator } from "..";
import { Migration } from "../../ContentPersistence";
import { ListOpts } from "../../../../typings";
export default class KnexContent implements ContentAdapter {
    knex: Knex;
    constructor(inputKnex: Knex);
    create(storeData: Cotype.Data, indexData: Cotype.Data, model: Cotype.Model, models: Cotype.Model[], author: string): Promise<any>;
    /**
     * Test if the any fields in data that are marked as unique in the model
     * already exists.
     */
    testUniqueFields(model: Cotype.Model, models: Cotype.Model[], data: any, id?: string): Promise<void>;
    /**
     * Test if a value of a position field already Exists
     */
    testPositionFields(model: Cotype.Model, models: Cotype.Model[], data: any, id: string): Promise<any>;
    createRevision(storeData: Cotype.Data, indexData: Cotype.Data, model: Cotype.Model, models: Cotype.Model[], id: string, author: string): Promise<number>;
    createRev(data: Cotype.Data, searchData: Cotype.Data, model: Cotype.Model, models: Cotype.Model[], id: string, rev: number, author: string): Promise<number>;
    indexRevision(data: Cotype.Data, searchData: Cotype.Data, model: Cotype.Model, models: Cotype.Model[], id: string, rev: number, published?: boolean): Promise<void>;
    extractValues(data: any, model: Cotype.Model, id: string, rev: number, published: boolean): Knex.BatchInsertBuilder<any, number[]>;
    extractText(data: any, model: Cotype.Model, id: string, rev: number, published: boolean): Knex.QueryBuilder<any, number[]>;
    loadRefs(ids: string[], types: string[] | false, previewOpts?: Cotype.PreviewOpts): Knex.QueryBuilder<any, ({
        _base: any;
        _hasSelection: true;
        _keys: string;
        _aliases: {};
        _single: boolean;
        _intersectProps: {};
        _unionProps: unknown;
    } | {
        _base: any;
        _hasSelection: true;
        _keys: "c.id" | "c.type" | "crv.data";
        _aliases: {};
        _single: false;
        _intersectProps: {};
        _unionProps: never;
    })[]>;
    loadInverseRefs(ids: string[], types: string[] | false, previewOpts?: Cotype.PreviewOpts): Knex.QueryBuilder<any, ({
        _base: any;
        _hasSelection: true;
        _keys: string;
        _aliases: {};
        _single: boolean;
        _intersectProps: {};
        _unionProps: unknown;
    } | {
        _base: any;
        _hasSelection: true;
        _keys: "c.id" | "c.type" | "crv.data";
        _aliases: {};
        _single: false;
        _intersectProps: {};
        _unionProps: never;
    })[]>;
    loadContentReferences(id: string[], model: Cotype.Model, models: Cotype.Model[], previewOpts?: Cotype.PreviewOpts, joins?: Cotype.Join[]): Promise<Cotype.Data[]>;
    loadMediaFromContents(ids: string[], published?: boolean): Promise<Cotype.Meta[]>;
    load(model: Cotype.Model, id: string, previewOpts?: Cotype.PreviewOpts): Promise<any>;
    loadRevision(model: Cotype.Model, id: string, rev: number): Promise<any>;
    listVersions(model: Cotype.Model, id: string): Promise<{
        latest: boolean;
        published: boolean;
        id: string;
        type: string;
        model: string;
        title: string;
        image?: string | undefined;
        kind: string;
        childCount?: string | undefined;
        orderValue?: string | undefined;
        rev: number;
        latest_rev: number;
        published_rev: boolean;
        author_name: string;
        date: string;
    }[]>;
    setPublishedRev(model: Cotype.Model, id: string, publishedRev: number | null, models: Cotype.Model[]): Promise<void>;
    /**
     * Make sure all referenced contents are either optional or:
     * - published
     * - visible before the referring content
     * - visible until the referring content expires
     */
    checkReferences(id: string, rev: number, schedule: Cotype.Schedule): Promise<void>;
    /**
     * Make sure all contents referring to the given id are either deleted,
     * no longer visible (or - TODO - optional).
     */
    checkReferrers(id: string): Promise<void>;
    delete(model: Cotype.Model, id: string): Promise<void>;
    schedule(model: Cotype.Model, id: string, schedule: Cotype.Schedule): Promise<void>;
    search(term: string, exact: boolean, listOpts: Cotype.ListOpts, previewOpts?: Cotype.PreviewOpts): Promise<{
        total: number;
        items: any;
    }>;
    findByMedia(media: string): Promise<any[]>;
    list(model: Cotype.Model, models: Cotype.Model[], listOpts?: Cotype.ListOpts, criteria?: Cotype.Criteria, previewOpts?: Cotype.PreviewOpts): Promise<Cotype.ListChunk<Cotype.Content>>;
    rewrite(model: Cotype.Model, models: Cotype.Model[], iterator: RewriteIterator): Promise<void>;
    migrate(migrations: Migration[], callback: (adapter: ContentAdapter, outstanding: Migration[]) => Promise<void>): Promise<unknown>;
    listLastUpdatedContent(models: string[], opts: ListOpts, user?: string): Promise<{
        total: number;
        items: any[];
    }>;
    listUnpublishedContent(models: string[], opts: ListOpts): Promise<{
        total: number;
        items: any[];
    }>;
    private aggregateRefs;
    private parseData;
}
