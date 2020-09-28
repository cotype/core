/**
 * The part of the persistence layer that handles the content.
 */

import * as Cotype from "../../typings";
import _escapeRegExp from "lodash/escapeRegExp";
import _flatten from "lodash/flatten";
import _uniq from "lodash/uniq";
import _cloneDeep from "lodash/cloneDeep";
import { ContentAdapter } from "./adapter";
import removeDeprecatedData from "./removeDeprecatedData";
import ReferenceConflictError from "./errors/ReferenceConflictError";
import { isAllowed, Permission } from "../auth/acl";
import getRefUrl from "../content/getRefUrl";
import convert from "../content/convert";
import { PersistenceConfig } from ".";
import { getDeepJoins } from "../content/rest/filterRefData";
import {
  ContentFormat,
  Data,
  MetaData,
  Model,
  ContentRefs,
  Content,
  Principal,
  ListOpts,
  ListChunk
} from "../../typings";
import extractMatch from "../model/extractMatch";
import extractText from "../model/extractText";
import log from "../log";
import visit, { NO_STORE_VALUE } from "../model/visit";
import setPosition from "../model/setPosition";
import MigrationContext from "./MigrationContext";
import { createModelFilter } from "../model/filterModels";

export type Migration = {
  name: string;
  execute(ctx: MigrationContext): Promise<any>;
};

export type RewriteDataIterator = (
  data: Data,
  meta: MetaData
) => void | Data | Promise<Data>;

function findValueByPath(path: string | undefined, data: Cotype.Data, language?:string) {
  if (!path) return;

  const titlePath = path.split(".");

  const title = (titlePath.reduce(
    (obj, key) => (obj ? obj[key] : undefined),
    data
  ) as unknown) as string | undefined;

  if (title && typeof title !== "string") {
    return title[language || Object.keys(title)[0]];
  }
  return title;
}
export default class ContentPersistence implements Cotype.VersionedDataSource {
  adapter: ContentAdapter;
  models: Cotype.Model[];
  config: PersistenceConfig;

  /** contentTypes is empty since this is the default/fallback implementation */
  contentTypes: string[] = [];

  constructor(
    adapter: ContentAdapter,
    models: Cotype.Model[],
    config: PersistenceConfig
  ) {
    this.adapter = adapter;
    this.models = models;
    this.config = config;
  }

  getModel(name: string) {
    return this.models.find(
      m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
  }

  canView(principal?: Cotype.Principal) {
    return (item: { model: string } | null): item is any => {
      if (!item || !item.model) return false;
      const model = this.getModel(item.model);
      if (!model) return false;
      return !principal || isAllowed(principal, model, Permission.view);
    };
  }

  async applyPreHooks<T>(
    event: keyof Cotype.PreHooks,
    model: Cotype.Model,
    data: Cotype.Data
  ): Promise<Cotype.Data> {
    if (!this.config.contentHooks || !this.config.contentHooks.preHooks)
      return data;
    const preHook = this.config.contentHooks.preHooks[event];
    if (!preHook) return data;

    try {
      const hookData = await preHook(model, data);
      return hookData;
    } catch (error) {
      log.error(
        `💥  An error occurred in the content preHook "${event}" for a "${model.name}" content`
      );
      log.error(error);
      return data;
    }
  }

  async applyPostHooks(
    event: keyof Cotype.PostHooks,
    model: Cotype.Model,
    dataRecord: Cotype.DataRecord
  ): Promise<void> {
    if (!this.config.contentHooks || !this.config.contentHooks.postHooks)
      return;
    const postHook = this.config.contentHooks.postHooks[event];
    if (!postHook) return;

    try {
      await postHook(model, dataRecord);
    } catch (error) {
      log.error(
        `💥  An error occurred in the content content postHook "${event}" for a "${model.name}" content`
      );
      log.error(error);
    }
  }

  createItem = (content: Cotype.Content): Cotype.Item | null => {
    const { id, type, data } = content;

    const model = this.getModel(type);
    if (!model) return null;
    const { title: titlePath, image:imagePath, singular, orderBy } = model;

    const title = findValueByPath(titlePath, data);
    const orderValue = findValueByPath(orderBy || titlePath, data);
    const image = findValueByPath(imagePath, data);

    return {
      id,
      model: type,
      type: model.type,
      title: title || singular,
      image,
      kind: singular,
      orderValue: orderValue || title
    };
  };

  createSearchResultItem = (
    content: Cotype.Content,
    term: string,
    external: boolean = true,
    language?: string
  ): Cotype.SearchResultItem | null => {
    const { id, type, data } = content;

    const model = this.getModel(type);
    if (!model) return null;
    const { title: titlePath, image:imagePath, singular } = model;

    const title = findValueByPath(titlePath, data, language);
    const image = findValueByPath(imagePath, data, language);

    return {
      id,
      type: external ? undefined : model.type,
      kind: external ? undefined : singular,
      title: title || singular,
      description: extractMatch(data, model, term, !external),
      image,
      model: model.name,
      url: external
        ? (getRefUrl(data, model.urlPath, language) as string)
        : undefined
    };
  };

  createItems(
    contents: Cotype.Content[],
    principal?: Cotype.Principal
  ): Cotype.Item[] {
    return contents.map(this.createItem).filter(this.canView(principal));
  }

  async create(
    principal: Cotype.Principal,
    model: Cotype.Model,
    data: Cotype.Data,
    models: Cotype.Model[],
    activeLanguages: string[]
  ) {
    data = this.setOrderPosition(data, model, models);
    const hookData = await this.applyPreHooks("onCreate", model, data);

    const { storeData, searchData } = await this.splitStoreAndIndexData(
      hookData,
      model
    );

    // NOTE: principal.id will always be set since anonymous access is prevented by ACL.
    const id = await this.adapter.create(
      storeData,
      searchData,
      model,
      models,
      principal.id!,
      activeLanguages
    );

    this.applyPostHooks("onCreate", model, {
      id,
      data: storeData,
      activeLanguages
    });

    return { id: String(id), data: storeData, activeLanguages };
  }

  async createRevision(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    data: object,
    models: Cotype.Model[],
    activeLanguages: string[]
  ) {
    const { storeData, searchData } = await this.splitStoreAndIndexData(
      data,
      model
    );
    // NOTE: principal.id will always be set since anonymous access is prevented by ACL.
    const rev = await this.adapter.createRevision(
      storeData,
      searchData,
      model,
      models,
      id,
      principal.id!,
      activeLanguages
    );

    return { rev, data: storeData };
  }

  async fetchRefs(
    ids: string[],
    contentFormat: ContentFormat,
    previewOpts: Cotype.PreviewOpts = {},
    join: Cotype.Join = {},
    model: Cotype.Model,
    language?: string
  ): Promise<Cotype.Refs> {
    // load all content the loaded content is referencing

    const contentRefs = await this.adapter.loadContentReferences(
      ids,
      model,
      this.models,
      previewOpts,
      getDeepJoins(join, this.models)
    );

    // load meta data for media file for this content and all the references
    const mediaRefs = await this.adapter.loadMediaFromContents(
      ids.concat(contentRefs.map(c => c.id)),
      previewOpts.publishedOnly
    );

    // sort content into type categories
    const sortedContentRefs: ContentRefs = {};

    contentRefs.forEach(({ data, ...ref }) => {
      // ignore unknown content
      const contentModel = this.getModel(ref.type);
      if (!contentModel) return;

      if (!sortedContentRefs[ref.type]) {
        sortedContentRefs[ref.type] = {};
      }

      sortedContentRefs[ref.type][ref.id] = {
        ...ref,
        data
      } as Content;
    });

    // convert sorted references
    // we need to separate the sorting step from the converting step
    // because we need the whole refs object to convert correctly (urls)
    Object.entries(sortedContentRefs).forEach(([type, items]) => {
      const contentModel = this.getModel(type) as Model;
      return Object.values(items).forEach(item => {
        return {
          ...item,
          data: convert({
            content: removeDeprecatedData(item.data, contentModel),
            contentModel,
            contentRefs: sortedContentRefs,
            contentFormat,
            allModels: this.models,
            mediaUrl: this.config.mediaUrl,
            previewOpts,
            language,
            fallBackLanguage: this.config.languages[0]
          })
        };
      });
    });

    // assign media refs to an object with it's ids as keys
    const media: Cotype.MediaRefs = {};
    mediaRefs.forEach(r => {
      media[r.id] = r;
    });

    return { content: sortedContentRefs, media };
  }

  async load(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    join: Cotype.Join = {},
    contentFormat: ContentFormat,
    previewOpts?: Cotype.PreviewOpts,
    language?: string
  ): Promise<Cotype.ContentWithRefs | null> {
    const content = await this.adapter.load(model, id, previewOpts);
    if (!content) return content;

    const refs = await this.fetchRefs(
      [id],
      contentFormat,
      previewOpts,
      join,
      model,
      language
    );

    const convertedContentData = convert({
      content: removeDeprecatedData(content.data, model),
      contentRefs: refs.content,
      contentModel: model,
      contentFormat,
      allModels: this.models,
      mediaUrl: this.config.mediaUrl,
      previewOpts,
      language,
      fallBackLanguage: this.config.languages[0]
    });

    return {
      ...content,
      data: convertedContentData,
      _refs: refs
    };
  }

  async loadInternal(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.Content | null> {
    const content = await this.adapter.load(model, id, previewOpts);
    if (content) {
      removeDeprecatedData(content.data, model, true);
    }
    return content;
  }

  async loadItem(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string
  ): Promise<Cotype.Item | null> {
    const content = await this.adapter.load(model, id);
    if (content) {
      return this.createItem(content);
    }
    return null;
  }

  async loadRevision(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    rev: number
  ): Promise<Cotype.Revision> {
    const content = await this.adapter.loadRevision(model, id, rev);
    if (content) {
      removeDeprecatedData(content.data, model);
    }
    return content;
  }

  listVersions(principal: Cotype.Principal, model: Cotype.Model, id: string) {
    return this.adapter.listVersions(model, id);
  }

  async update(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    data: object,
    models: Cotype.Model[],
    activeLanguages: string[]
  ): Promise<{ id: string; data: object }> {
    const hookData = await this.applyPreHooks("onSave", model, data);
    const rev = await this.createRevision(
      principal,
      model,
      id,
      hookData,
      models,
      activeLanguages
    );

    const resp = {
      id: String(id),
      data: rev.data,
      activeLanguages
    };

    this.applyPostHooks("onSave", model, resp);
    return resp;
  }

  async schedule(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    schedule: Cotype.Schedule
  ): Promise<void> {
    await this.adapter
      .schedule(model, id, schedule)
      .catch(err => this.processReferenceConflictError(principal, err));
    const content = await this.adapter.load(model, id);
    if (content) {
      this.applyPostHooks("onSchedule", model, content);
    }
  }

  async publishRevision(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    rev: number,
    models: Cotype.Model[]
  ): Promise<void> {
    const resp = await this.adapter
      .setPublishedRev(model, id, rev, models)
      .catch(err => this.processReferenceConflictError(principal, err));
    const content = await this.adapter.load(model, id);
    if (content) {
      this.applyPostHooks(
        rev !== null ? "onPublish" : "onUnpublish",
        model,
        content
      );
    }
    return resp;
  }

  async delete(principal: Cotype.Principal, model: Cotype.Model, id: string) {
    const content = await this.adapter.load(model, id);
    const resp = await this.adapter
      .delete(model, id)
      .catch(err => this.processReferenceConflictError(principal, err));
    if (content) {
      this.applyPostHooks("onDelete", model, content);
    }
    return resp;
  }

  async list(
    principal: Cotype.Principal,
    model: Cotype.Model,
    opts: Cotype.ListOpts,
    criteria?: Cotype.Criteria
  ): Promise<Cotype.ListChunk<Cotype.Item>> {
    if (!opts.orderBy) {
      opts.orderBy = model.orderBy || model.title;
    }
    if (!opts.order) {
      opts.order = model.order || "desc";
    }
    const { total, items } = await this.adapter.list(
      model,
      this.models,
      opts,
      criteria
    );
    return {
      total,
      items: this.createItems(items)
    };
  }

  async findByMedia(media: string): Promise<Cotype.Item[]> {
    const contents = await this.adapter.findByMedia(media);
    return this.createItems(contents);
  }

  async find(
    principal: Cotype.Principal,
    model: Cotype.Model,
    opts: Cotype.ListOpts,
    contentFormat: Cotype.ContentFormat,
    join: Cotype.Join,
    criteria?: Cotype.Criteria,
    previewOpts?: Cotype.PreviewOpts,
    language?: string
  ): Promise<Cotype.ListChunkWithRefs<Cotype.Content>> {
    const items = await this.adapter.list(
      model,
      this.models,
      opts,
      criteria,
      previewOpts,
      language
    );
    if (!items.total) return { ...items, _refs: { content: {}, media: {} } };

    const _refs = await this.fetchRefs(
      items.items.map(i => i.id),
      contentFormat,
      previewOpts,
      join,
      model,
      language
    );

    const convertedItems = {
      ...items,
      items: items.items.map(i => ({
        ...i,
        data: convert({
          content: removeDeprecatedData(i.data, model),
          contentRefs: _refs.content,
          contentModel: model,
          contentFormat,
          allModels: this.models,
          mediaUrl: this.config.mediaUrl,
          previewOpts,
          language,
          fallBackLanguage: this.config.languages[0]
        })
      }))
    };

    return { ...convertedItems, _refs };
  }

  async findInternal(
    principal: Cotype.Principal,
    model: Cotype.Model,
    opts: Cotype.ListOpts,
    criteria?: Cotype.Criteria,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.ListChunk<Cotype.Content>> {
    return this.adapter.list(model, this.models, opts, criteria, previewOpts);
  }

  async search(
    principal: Cotype.Principal,
    term: string,
    exact: boolean,
    opts: Cotype.ListOpts,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.ListChunk<Cotype.SearchResultItem>> {
    const { total, items } = await this.adapter.search(
      term,
      exact,
      opts,
      previewOpts
    );
    return {
      total,
      items: items
        .map(c => this.createSearchResultItem(c, term, false))
        .filter(this.canView(principal))
    };
  }

  async externalSearch(
    principal: Cotype.Principal,
    term: string,
    opts: Cotype.ListOpts,
    previewOpts?: Cotype.PreviewOpts,
    language?: string
  ): Promise<Cotype.ListChunk<Cotype.SearchResultItem>> {
    const clearedTerm = term.replace("*", " ");
    const textSearch = await this.adapter.search(
      clearedTerm.length > 0 ? clearedTerm : " ",
      false,
      opts,
      previewOpts
    );

    const items = textSearch.items
      .map(c => this.createSearchResultItem(c, term, true, language))
      .filter(this.canView(principal)) as Cotype.SearchResultItem[];

    return {
      total: textSearch.total,
      items
    };
  }

  async suggest(
    principal: Cotype.Principal,
    term: string,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<string[]> {
    const { items } = await this.adapter.search(term, true, {}, previewOpts);
    const pattern = `${_escapeRegExp(
      term
    )}([\\w|ü|ö|ä|ß|Ü|Ö|Ä]*['|\\-|\\/|_|+]*[\\w|ü|ö|ä|ß|Ü|Ö|Ä]+|[\\w|ü|ö|ä|ß|Ü|Ö|Ä]*)`;
    const re = new RegExp(pattern, "ig");
    const terms: string[] = [];
    items.forEach(item => {
      const model = this.getModel(item.type);
      if (model && this.canView(principal)({ model: item.type })) {
        const text = extractText(item.data, model);
        const m = text.match(re);
        if (m) {
          m.forEach(s => {
            const cleaned = s.trim();
            if (
              cleaned &&
              !terms.some(t => t.toLowerCase() === cleaned.toLowerCase())
            )
              terms.push(cleaned);
          });
        }
      }
    });
    return terms.sort((a, b) => a.length - b.length || a.localeCompare(b));
  }

  rewrite(modelName: string, iterator: RewriteDataIterator) {
    const model = this.getModel(modelName);
    if (!model) throw new Error(`No such model: ${modelName}`);
    return this.adapter.rewrite(
      model,
      this.models,
      async (data: Data, meta: any) => {
        let rewritten = await iterator(data, meta);
        if (rewritten) {
          rewritten = await this.applyPreHooks("onSave", model, rewritten);
          return this.splitStoreAndIndexData(rewritten, model);
        }
        return rewritten;
      }
    );
  }

  migrate(migrations: Migration[]) {
    this.adapter.migrate(migrations, async (adapter, outstanding) => {
      const content = new ContentPersistence(adapter, this.models, this.config);
      const ctx = new MigrationContext(content);
      for (const m of outstanding) {
        await m.execute(ctx);
      }
    });
  }

  createItemsWithAuthorAndDate = (listChunk: ListChunk<Content>) => {
    return this.createItems(listChunk.items).map((i, idx) => {
      const { date, author } = listChunk.items[idx];
      return { ...i, date, author_name: author };
    });
  };

  async listLastUpdatedContent(
    principal: Cotype.Principal,
    opts: ListOpts = { limit: 50, offset: 0 },
    byUser?: boolean
  ) {
    const filteredModels = this.models.filter(createModelFilter(principal));
    const listChunk = await this.adapter.listLastUpdatedContent(
      filteredModels.map(m => m.name),
      opts,
      byUser ? principal.id! : undefined
    );

    return {
      total: listChunk.total,
      items: this.createItemsWithAuthorAndDate(listChunk)
    };
  }
  async listUnpublishedContent(principal: Cotype.Principal, opts: ListOpts) {
    const filteredModels = this.models.filter(createModelFilter(principal));
    const listChunk = await this.adapter.listUnpublishedContent(
      filteredModels.map(m => m.name),
      opts
    );

    return {
      total: listChunk.total,
      items: this.createItemsWithAuthorAndDate(listChunk)
    };
  }

  private processReferenceConflictError = (principal: Principal, err: any) => {
    if (err instanceof ReferenceConflictError && err.refs) {
      err.refs = this.createItems(err.refs as any, principal);
      throw err;
    }
  };

  private async setOrderPosition(
    data: Cotype.Data,
    model: Cotype.Model,
    models: Cotype.Model[]
  ) {
    if (model.orderBy) {
      const lastItem = await this.adapter.list(model, models, {
        limit: 1,
        orderBy: model.orderBy,
        order: "desc",
        offset: 0
      });

      const orderPath = model.orderBy.split(".");

      const lastOrderValue = (orderPath.reduce(
        (obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined),
        lastItem.total > 0 ? lastItem.items[0].data : {}
      ) as unknown) as string;

      data = setPosition(data, model, lastOrderValue);
    }
    return data;
  }

  private splitStoreAndIndexData(data: Cotype.Data, model: Cotype.Model) {
    const storeData = _cloneDeep(data);

    visit(storeData, model, {
      string: (_, field: Cotype.Text) => {
        if (field.store === false) return NO_STORE_VALUE;
      }
    });

    return { storeData, searchData: data };
  }
}
