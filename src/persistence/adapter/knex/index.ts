import path from "path";
import { promisify } from "util";
import knex, { Config, SeedsConfig } from "knex";
import glob from "glob-promise";
import { mkdirp, copyFile, mkdir } from "fs-extra";
import { PersistenceAdapter } from "..";
import KnexSettings from "./KnexSettings";
import KnexContent from "./KnexContent";
import KnexMedia from "./KnexMedia";
import logger from "../../../log";

type KnexSeedsConfig = SeedsConfig & {
  directory: string;
  uploads?: string;
};

export type KnexConfig = Config & {
  migrate?: boolean;
  seeds?: KnexSeedsConfig;
};

const migrationOptions = {
  directory: path.join(__dirname, "..", "..", "..", "..", "knex_migrations")
};

export default async function(
  userConfig: KnexConfig
): Promise<PersistenceAdapter> {
  // Suppress warnings
  const log = {
    warn() {
      /* noop */
    },
    deprecate() {
      /* noop */
    },
    debug: logger.debug,
    error: logger.error
  };

  async function seedMedia({ directory, uploads }: KnexSeedsConfig) {
    if (!uploads) {
      throw new Error("Need uploads directory for media seeding");
    }
    const mediaDir = path.resolve(directory, "_media");
    const files = await glob("**/*", { cwd: mediaDir, nodir: true });

    try {
      await promisify(mkdir)(path.resolve(uploads));
    } catch (e) {
      /* noop */
    }

    return Promise.all(
      files.map(async file => {
        await mkdirp(path.join(uploads, path.dirname(file)));
        await promisify(copyFile)(
          path.join(mediaDir, file),
          path.resolve(uploads, file)
        );
      })
    );
  }

  async function init(customConfig: KnexConfig = {}) {
    const config = { log, ...userConfig, ...customConfig };

    if (config.client === "sqlite3") {
      config.pool = {
        ...config.pool,
        afterCreate(conn: any, cb: any) {
          conn.run("PRAGMA foreign_keys = ON", cb);
        }
      };
    }

    const k = knex(config);

    if (config.migrate !== false) {
      await k.migrate.latest(migrationOptions);
    }

    if (config.migrate !== false && config.seeds) {
      await Promise.all([k.seed.run(), seedMedia(config.seeds)]);
    }

    return k;
  }

  const db = await init();
  return {
    settings: new KnexSettings(db),
    content: new KnexContent(db),
    media: new KnexMedia(db),
    shutdown: () => new Promise((res, rej) => db.destroy().then(res, rej))
  };
}
