/**
 * The part of the persistence layer that handles the content.
 */

import * as Cotype from "../../typings";
import _escapeRegExp from "lodash/escapeRegExp";
import _flatten from "lodash/flatten";
import _uniq from "lodash/uniq";
import { ContentAdapter } from "./adapter";
import removeDeprecatedData from "./removeDeprecatedData";
import ReferenceConflictError from "./errors/ReferenceConflictError";
import { isAllowed, Permission } from "../auth/acl";
import getRefUrl from "../content/getRefUrl";
import convert from "../content/convert";
import { Config } from ".";
import { getDeepJoins } from "../content/rest/filterRefData";
import { ContentFormat, Data, MetaData } from "../../typings";
import extractMatch from "../model/extractMatch";
import extractText from "../model/extractText";
import log from "../log";
import MigrationContext from "./MigrationContext";

export type Migration = {
  name: string;
  execute(ctx: MigrationContext): Promise<any>;
};

export type RewriteIterator = (
  data: Data,
  meta: MetaData
) => void | Data | Promise<Data>;

function findValueByPath(path: string | undefined, data: Cotype.Data) {
  if (!path) return;

  const titlePath = path.split(".");

  const title = (titlePath.reduce(
    (obj, key) => (obj ? obj[key] : undefined),
    data
  ) as unknown) as (string | undefined);

  return title;
}

export default class ContentPersistence implements Cotype.VersionedDataSource {
  adapter: ContentAdapter;
  models: Cotype.Model[];
  /** contentTypes is empty since this is the default/fallback implementation */
  contentTypes: string[] = [];
  config: Config = {};

  constructor(adapter: ContentAdapter, models: Cotype.Model[], config: Config) {
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
    data: Cotype.Data,
    action: (d: Cotype.Data) => Promise<T>
  ): Promise<[T, Cotype.Data]> {
    if (!this.config.contentHooks || !this.config.contentHooks.preHooks)
      return Promise.all([action(data), data]);
    const preHook = this.config.contentHooks.preHooks[event];
    if (!preHook) return Promise.all([action(data), data]);

    try {
      const hookData = await preHook(model, data);
      return Promise.all([action(hookData), hookData]);
    } catch (error) {
      log.error(
        `💥  An error occurred in the content preHook "${event}" for a "${model.name}" content`
      );
      log.error(error);
      return Promise.all([action(data), data]);
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
    const { title: titlePath, image, singular, orderBy } = model;

    const title = findValueByPath(titlePath, data);
    const orderValue = findValueByPath(orderBy || title, data);

    return {
      id,
      model: type,
      type: model.type,
      title: title || singular,
      image: image && ((data || {})[image] || null),
      kind: singular,
      orderValue: orderValue || title
    };
  };

  createSearchResultItem = (
    content: Cotype.Content,
    term: string
  ): Cotype.SearchResultItem | null => {
    const { id, type, data } = content;

    const model = this.getModel(type);
    if (!model) return null;
    const { title: titlePath, image, singular } = model;

    const title = findValueByPath(titlePath, data);

    return {
      id,
      title: title || singular,
      description: extractMatch(data, model, term),
      image: image && ((data || {})[image] || null),
      model: model.name,
      url: getRefUrl(data, model.urlPath) as string
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
    models: Cotype.Model[]
  ) {
    // NOTE: principal.id will always be set since anonymous access is prevented by ACL.

    const [id, hookData] = await this.applyPreHooks(
      "onCreate",
      model,
      data,
      (d: Cotype.Data) => this.adapter.create(model, d, principal.id!, models)
    );

    this.applyPostHooks("onCreate", model, { id, data: hookData });

    return { id, data: hookData };
  }

  async createRevision(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    data: object,
    models: Cotype.Model[]
  ) {
    // NOTE: principal.id will always be set since anonymous access is prevented by ACL.
    return this.adapter.createRevision(model, id, principal.id!, data, models);
  }

  async fetchRefs(
    ids: string[],
    contentFormat: ContentFormat,
    previewOpts: Cotype.PreviewOpts = {},
    join: Cotype.Join = {},
    model: Cotype.Model
  ): Promise<Cotype.Refs> {
    // load all content the loaded content is referencing

    const contentRefs = await this.adapter.loadContentReferences(
      ids,
      model,
      this.models,
      previewOpts.publishedOnly,
      getDeepJoins(join, this.models)
    );

    // load meta data for media file for this content and all the references
    const mediaRefs = await this.adapter.loadMediaFromContents(
      ids.concat(contentRefs.map(c => c.id)),
      previewOpts.publishedOnly
    );

    // sort and and convert loaded content into type categories
    const sortedContentRefs: { [key: string]: any } = {};

    contentRefs.forEach(c => {
      // ignore unknown content
      const contentModel = this.getModel(c.type);
      if (!contentModel) return;

      if (!sortedContentRefs[c.type]) {
        sortedContentRefs[c.type] = {};
      }

      // convert referenced data
      const data = convert({
        content: removeDeprecatedData(c.data, contentModel),
        contentModel,
        contentFormat,
        allModels: this.models,
        baseUrls: this.config.baseUrls,
        previewOpts
      });

      sortedContentRefs[c.type][c.id] = {
        ...c,
        data
      };
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
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.ContentWithRefs | null> {
    const content = await this.adapter.load(model, id, previewOpts);
    if (!content) return content;

    const refs = await this.fetchRefs(
      [id],
      contentFormat,
      previewOpts,
      join,
      model
    );

    const convertedContentData = convert({
      content: removeDeprecatedData(content.data, model),
      contentRefs: refs.content,
      contentModel: model,
      contentFormat,
      allModels: this.models,
      baseUrls: this.config.baseUrls,
      previewOpts
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
    models: Cotype.Model[]
  ): Promise<{ id: string; data: object }> {
    const hookResp = await this.applyPreHooks("onSave", model, data, d =>
      this.createRevision(principal, model, id, d, models)
    );
    const resp = {
      id,
      data: hookResp[1]
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
    await this.adapter.schedule(model, id, schedule);
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
    try {
      const resp = await this.adapter.setPublishedRev(model, id, rev, models);
      const content = await this.adapter.load(model, id);
      if (content) {
        this.applyPostHooks(
          rev !== null ? "onPublish" : "onUnpublish",
          model,
          content
        );
      }
      return resp;
    } catch (err) {
      if (err instanceof ReferenceConflictError && err.refs) {
        err.refs = this.createItems(err.refs as any, principal);
        throw err;
      }
    }
  }

  async delete(principal: Cotype.Principal, model: Cotype.Model, id: string) {
    try {
      const content = await this.adapter.load(model, id);
      const resp = await this.adapter.delete(model, id);
      if (content) {
        this.applyPostHooks("onDelete", model, content);
      }
      return resp;
    } catch (err) {
      if (err instanceof ReferenceConflictError && err.refs) {
        err.refs = this.createItems(err.refs as any, principal);
        throw err;
      }
    }
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
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.ListChunkWithRefs<Cotype.Content>> {
    const items = await this.adapter.list(
      model,
      this.models,
      opts,
      criteria,
      previewOpts
    );
    if (!items.total) return { ...items, _refs: { content: {}, media: {} } };

    const _refs = await this.fetchRefs(
      items.items.map(i => i.id),
      contentFormat,
      previewOpts,
      join,
      model
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
          baseUrls: this.config.baseUrls,
          previewOpts
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
  ): Promise<Cotype.ListChunk<Cotype.Item>> {
    const { total, items } = await this.adapter.search(
      term,
      exact,
      opts,
      previewOpts
    );
    return {
      total,
      items: this.createItems(items, principal)
    };
  }

  async externalSearch(
    principal: Cotype.Principal,
    term: string,
    opts: Cotype.ListOpts,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<Cotype.ListChunk<Cotype.SearchResultItem>> {
    const { total, items } = await this.adapter.search(
      term,
      false,
      opts,
      previewOpts
    );

    return {
      total,
      items: items
        .map(c => this.createSearchResultItem(c, term))
        .filter(this.canView(principal))
    };
  }

  async suggest(
    principal: Cotype.Principal,
    term: string,
    previewOpts?: Cotype.PreviewOpts
  ): Promise<string[]> {
    const { items } = await this.adapter.search(term, true, {}, previewOpts);
    const pattern = `${_escapeRegExp(term)}(\\S+|\\s\\S+)`;
    const re = new RegExp(pattern, "ig");
    const terms: string[] = [];
    items.forEach(item => {
      const model = this.getModel(item.type);
      if (model && this.canView(principal)({ model: item.type })) {
        const text = extractText(item.data, model);
        const m = text.match(re);
        if (m) {
          m.forEach(s => {
            if (s && !terms.includes(s)) terms.push(s);
          });
        }
      }
    });
    return terms;
  }

  rewrite(modelName: string, iterator: RewriteIterator) {
    const model = this.getModel(modelName);
    if (!model) throw new Error(`No such model: ${modelName}`);
    return this.adapter.rewrite(
      model,
      this.models,
      async (data: Data, meta: any) => {
        const rewritten = await iterator(data, meta);
        // this.applyPreHooks("onSave", model, rewritten)
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
}
