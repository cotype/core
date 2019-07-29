/**
 * The persistence layer. Access to any underlying datasource is
 * routed through this class and handed over to an adapter.
 * NOTE: Currently there is only an adapter for relational databases.
 * Adding other storage backends like elasticsearch or mongodb is possible.
 */

import fs from "fs";
import path from "path";

import { Models, BaseUrls, ContentHooks, Model } from "../../typings";
import { PersistenceAdapter, Migration } from "./adapter";
import init from "./init";
import withAuth from "../auth/withAuth";

import SettingsPersistence from "./SettingsPersistence";
import ContentPersistence from "./ContentPersistence";
import MediaPersistence from "./MediaPersistence";
import MigrationContext from "./MigrationContext";

export type Config = {
  baseUrls?: BaseUrls;
  contentHooks?: ContentHooks;
  migrationDir?: string;
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

  init() {
    return init(this.settings);
  }

  async migrate(dir: string, models: Model[]) {
    const extensions = Object.keys(require.extensions);
    const files = fs.readdirSync(dir).sort();
    const migrations = files
      .map(f => {
        const ext = path.extname(f);
        if (extensions.includes(ext)) {
          const name = path.basename(f, ext);
          return {
            name,
            async execute(ctx: MigrationContext) {
              const fn = require(path.join(dir, name));
              await fn(ctx);
            }
          };
        }
      })
      .filter((m): m is Migration => !!m);
    this.adapter.content.migrate(migrations, models);
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
  await p.init();
  if (config.migrationDir) {
    await p.migrate(config.migrationDir, models.content);
  }
  return p;
};
