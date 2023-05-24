"use strict";
/**
 * The persistence layer. Access to any underlying datasource is
 * routed through this class and handed over to an adapter.
 * NOTE: Currently there is only an adapter for relational databases.
 * Adding other storage backends like elasticsearch or mongodb is possible.
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Persistence = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const init_1 = __importDefault(require("./init"));
const withAuth_1 = __importDefault(require("../auth/withAuth"));
const SettingsPersistence_1 = __importDefault(require("./SettingsPersistence"));
const ContentPersistence_1 = __importDefault(require("./ContentPersistence"));
const MediaPersistence_1 = __importDefault(require("./MediaPersistence"));
class Persistence {
    adapter;
    settings;
    content;
    media;
    constructor(models, adapter, config) {
        this.adapter = adapter;
        this.settings = new SettingsPersistence_1.default(adapter.settings, models.settings);
        this.content = (0, withAuth_1.default)(new ContentPersistence_1.default(adapter.content, models.content, config));
        this.media = new MediaPersistence_1.default(adapter.media, this.content, this.settings);
    }
    init() {
        return (0, init_1.default)(this.settings);
    }
    async migrate(dir) {
        const files = fs_1.default.readdirSync(dir).sort();
        const migrations = files
            .map(f => {
            if (f.match(/(?<!\.d)\.(js|ts)$/)) {
                const ext = path_1.default.extname(f);
                const name = path_1.default.basename(f, ext);
                return {
                    name,
                    async execute(ctx) {
                        const fn = require(path_1.default.join(dir, name));
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
exports.Persistence = Persistence;
async function createPersistence(models, adapter, config) {
    const p = new Persistence(models, adapter, config);
    await p.init();
    if (config.migrationDir) {
        await p.migrate(config.migrationDir);
    }
    return p;
}
exports.default = createPersistence;
//# sourceMappingURL=index.js.map