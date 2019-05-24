/**
 * The part of the persistence layer that handles media assets.
 */
import * as Cotype from "../../typings";
import { MediaAdapter } from "./adapter";

import ContentPersistence from "./ContentPersistence";
import SettingsPersistence from "./SettingsPersistence";

export default class MediaPeristence {
  adapter: MediaAdapter;
  content: ContentPersistence;
  settings: SettingsPersistence;

  constructor(
    adapter: MediaAdapter,
    content: ContentPersistence,
    settings: SettingsPersistence
  ) {
    this.adapter = adapter;
    this.content = content;
    this.settings = settings;
  }

  create(principal: Cotype.Principal, meta: Cotype.Meta) {
    return this.adapter.create(meta);
  }

  list(principal: Cotype.Principal, opts: Cotype.MediaListOpts) {
    return this.adapter.list(opts);
  }

  async update(
    principal: Cotype.Principal,
    id: string,
    data: Cotype.Media
  ): Promise<Cotype.Settings> {
    return this.adapter.update(id, data);
  }

  load(principal: Cotype.Principal, ids: string[]) {
    return this.adapter.load(ids);
  }

  findByHash(hashs: string[]) {
    return this.adapter.findByHash(hashs);
  }

  async delete(principal: Cotype.Principal, id: string) {
    try {
      await this.adapter.delete(id, this.content.models);
    } catch (err) {
      if (err.type === "content") {
        err.refs = await this.content.findByMedia(id);
      }
      if (err.type === "settings") {
        const model = this.settings.getModel(err.model);
        if (model) {
          const ref = await this.settings.findItem(
            principal,
            model,
            err.field,
            id
          );
          err.refs = [ref];
        }
      }
      throw err;
    }
  }
}
