import path from "path";
import { promisify } from "util";
import { knex } from "knex";
import glob from "glob-promise";
import { mkdirp, copyFile, mkdir } from "fs-extra";
import KnexSettings from "./KnexSettings";
import KnexContent from "./KnexContent";
import KnexMedia from "./KnexMedia";
import measureDbPerformance from "./measureDbPerformance";
import logger from "../../../log";
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
const migrationOptions = {
    directory: path.join(__dirname, "..", "..", "..", "..", "knex_migrations")
};
async function seedMedia({ directory, uploads }) {
    if (!uploads) {
        throw new Error("Need uploads directory for media seeding");
    }
    const mediaDir = path.resolve(directory, "_media");
    const files = await glob("**/*", { cwd: mediaDir, nodir: true });
    try {
        await promisify(mkdir)(path.resolve(uploads));
    }
    catch (e) {
        /* noop */
    }
    return Promise.all(files.map(async (file) => {
        await mkdirp(path.join(uploads, path.dirname(file)));
        await promisify(copyFile)(path.join(mediaDir, file), path.resolve(uploads, file));
    }));
}
async function init(customConfig = {}) {
    const config = Object.assign({ log }, customConfig);
    if (config.client === "sqlite3") {
        config.pool = Object.assign(Object.assign({}, config.pool), { afterCreate(conn, cb) {
                conn.run("PRAGMA foreign_keys = ON", cb);
            } });
    }
    const k = knex(config);
    if (config.migrate !== false) {
        await k.migrate.latest(migrationOptions);
        if (config.seeds) {
            await Promise.all([k.seed.run(), seedMedia(config.seeds)]);
        }
    }
    return k;
}
export default async function (userConfig) {
    const db = await init(userConfig);
    measureDbPerformance(db);
    return {
        settings: new KnexSettings(db),
        content: new KnexContent(db),
        media: new KnexMedia(db),
        shutdown: () => new Promise((res, rej) => db.destroy().then(res, rej))
    };
}
//# sourceMappingURL=index.js.map