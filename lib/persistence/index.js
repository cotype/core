/**
 * The persistence layer. Access to any underlying datasource is
 * routed through this class and handed over to an adapter.
 * NOTE: Currently there is only an adapter for relational databases.
 * Adding other storage backends like elasticsearch or mongodb is possible.
 *
 */
import fs from "fs";
import path from "path";
import init from "./init";
import withAuth from "../auth/withAuth";
import SettingsPersistence from "./SettingsPersistence";
import ContentPersistence from "./ContentPersistence";
import MediaPersistence from "./MediaPersistence";
export class Persistence {
    constructor(models, adapter, config) {
        this.adapter = adapter;
        this.settings = new SettingsPersistence(adapter.settings, models.settings);
        this.content = withAuth(new ContentPersistence(adapter.content, models.content, config));
        this.media = new MediaPersistence(adapter.media, this.content, this.settings);
    }
    init() {
        return init(this.settings);
    }
    async migrate(dir) {
        const files = fs.readdirSync(dir).sort();
        const migrations = files
            .map(f => {
            if (f.match(/(?<!\.d)\.(js|ts)$/)) {
                const ext = path.extname(f);
                const name = path.basename(f, ext);
                return {
                    name,
                    async execute(ctx) {
                        const fn = require(path.join(dir, name));
                        if (typeof fn === "object" && fn.default) {
                            return await fn.default(ctx);
                        }
                        await fn(ctx);
                    }
                };
            }
        })
            .filter((m) => !!m);
        await this.content.migrate(migrations);
    }
    shutdown() {
        return this.adapter.shutdown();
    }
}
export default async function createPersistence(models, adapter, config) {
    const p = new Persistence(models, adapter, config);
    await p.init();
    if (config.migrationDir) {
        await p.migrate(config.migrationDir);
    }
    return p;
}
//# sourceMappingURL=index.js.map