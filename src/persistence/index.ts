/**
 * The persistence layer. Access to any underlying datasource is
 * routed through this class and handed over to an adapter.
 * NOTE: Currently there is only an adapter for postgresql. Adding other
 * storage backends like elasticsearch or mongodb is possible.
 */
import { Models, BaseUrls, ContentHooks } from "../../typings";
import { PersistenceAdapter } from "./adapter";
import init from "./init";
import withAuth from "../auth/withAuth";

import SettingsPersistence from "./SettingsPersistence";
import ContentPersistence from "./ContentPersistence";
import MediaPersistence from "./MediaPersistence";

export type Config = {
  baseUrls?: BaseUrls;
  contentHooks?: ContentHooks;
};

export class Persistence {
  adapter: PersistenceAdapter;
  settings: SettingsPersistence;
  content: ContentPersistence;
  media: MediaPersistence;

  constructor(models: Models, adapter: PersistenceAdapter, config: Config) {
    this.adapter = adapter;
    this.settings = new SettingsPersistence(adapter.settings, models.settings);
    this.content = (withAuth(
      new ContentPersistence(adapter.content, models.content, config)
    ) as unknown) as ContentPersistence;

    this.media = new MediaPersistence(
      adapter.media,
      this.content,
      this.settings
    );
  }

  init(models: Models) {
    return init(this.settings, this.content, models);
  }

  shutdown() {
    return this.adapter.shutdown();
  }
}

export default async (
  models: Models,
  adapter: PersistenceAdapter,
  config: Config
) => {
  const p = new Persistence(models, adapter, config);
  await p.init(models);
  return p;
};
