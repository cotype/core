"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const knex_1 = require("knex");
const glob_promise_1 = __importDefault(require("glob-promise"));
const fs_extra_1 = require("fs-extra");
const KnexSettings_1 = __importDefault(require("./KnexSettings"));
const KnexContent_1 = __importDefault(require("./KnexContent"));
const KnexMedia_1 = __importDefault(require("./KnexMedia"));
const measureDbPerformance_1 = __importDefault(require("./measureDbPerformance"));
const log_1 = __importDefault(require("../../../log"));
// Suppress warnings
const log = {
    warn() {
        /* noop */
    },
    deprecate() {
        /* noop */
    },
    debug: log_1.default.debug,
    error: log_1.default.error
};
const migrationOptions = {
    directory: path_1.default.join(__dirname, "..", "..", "..", "..", "knex_migrations")
};
function seedMedia({ directory, uploads }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!uploads) {
            throw new Error("Need uploads directory for media seeding");
        }
        const mediaDir = path_1.default.resolve(directory, "_media");
        const files = yield (0, glob_promise_1.default)("**/*", { cwd: mediaDir, nodir: true });
        try {
            yield (0, util_1.promisify)(fs_extra_1.mkdir)(path_1.default.resolve(uploads));
        }
        catch (e) {
            /* noop */
        }
        return Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
            yield (0, fs_extra_1.mkdirp)(path_1.default.join(uploads, path_1.default.dirname(file)));
            yield (0, util_1.promisify)(fs_extra_1.copyFile)(path_1.default.join(mediaDir, file), path_1.default.resolve(uploads, file));
        })));
    });
}
function init(customConfig = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = Object.assign({ log }, customConfig);
        if (config.client === "sqlite3") {
            config.pool = Object.assign(Object.assign({}, config.pool), { afterCreate(conn, cb) {
                    conn.run("PRAGMA foreign_keys = ON", cb);
                } });
        }
        const k = (0, knex_1.knex)(config);
        if (config.migrate !== false) {
            yield k.migrate.latest(migrationOptions);
            if (config.seeds) {
                yield Promise.all([k.seed.run(), seedMedia(config.seeds)]);
            }
        }
        return k;
    });
}
function default_1(userConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield init(userConfig);
        (0, measureDbPerformance_1.default)(db);
        return {
            settings: new KnexSettings_1.default(db),
            content: new KnexContent_1.default(db),
            media: new KnexMedia_1.default(db),
            shutdown: () => new Promise((res, rej) => db.destroy().then(res, rej))
        };
    });
}
exports.default = default_1;
//# sourceMappingURL=index.js.map