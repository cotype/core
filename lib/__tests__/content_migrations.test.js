"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftsData = exports.publishedData = exports.initialModel = void 0;
const path_1 = __importDefault(require("path"));
const tempy_1 = __importDefault(require("tempy"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const faker_1 = __importDefault(require("faker"));
const supertest_1 = __importDefault(require("supertest"));
const __1 = require("..");
const util_1 = require("./util");
const FsStorage_1 = __importDefault(require("../media/storage/FsStorage"));
const local_thumbnail_provider_1 = __importDefault(require("@cotype/local-thumbnail-provider"));
const apiHelper_1 = require("../content/rest/__tests__/apiHelper");
const wait_for_expect_1 = __importDefault(require("wait-for-expect"));
const uploadDir = path_1.default.join(__dirname, ".uploads");
const initialFields = {
    initialField: {
        type: "string"
    }
};
exports.initialModel = {
    name: "migrateMe",
    fields: initialFields
};
const updatedModel = {
    name: exports.initialModel.name,
    fields: Object.assign(Object.assign({}, initialFields), { newField: {
            type: "string"
        } })
};
exports.publishedData = {
    initialField: faker_1.default.lorem.words(2),
    newField: faker_1.default.lorem.words(2)
};
exports.draftsData = {
    initialField: faker_1.default.lorem.words(2),
    newField: faker_1.default.lorem.words(2)
};
describe("content migrations", () => {
    let app;
    let persistence;
    let server;
    let find;
    beforeAll(async () => {
        const storage = new FsStorage_1.default(uploadDir);
        ({ app, persistence } = await (0, __1.init)({
            models: [updatedModel],
            storage,
            thumbnailProvider: new local_thumbnail_provider_1.default(storage),
            persistenceAdapter: (0, __1.knexAdapter)({
                client: "sqlite3",
                connection: {
                    filename: tempy_1.default.file()
                },
                seeds: {
                    directory: path_1.default.join(__dirname, "./migrationSeeds"),
                    uploads: uploadDir
                },
                useNullAsDefault: true
            }),
            migrationDir: path_1.default.join(__dirname, "./migrations")
        }));
        ({ server } = await (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin"));
        ({ find } = (0, apiHelper_1.createApiReadHelpers)(server));
    });
    afterAll(async () => {
        await fs_extra_1.default.remove(uploadDir);
        return persistence.shutdown();
    });
    it("should have rewritten/added/removed data", async () => {
        const defaultData = { _id: "1", _refs: { content: {}, media: {} } };
        await (0, wait_for_expect_1.default)(async () => {
            await expect(await find(exports.initialModel.name, "1", {}, false)).toStrictEqual(Object.assign(Object.assign({}, exports.draftsData), defaultData));
        });
        await (0, wait_for_expect_1.default)(async () => {
            expect(await find(exports.initialModel.name, "1", {}, true)).toStrictEqual(Object.assign(Object.assign({}, exports.publishedData), defaultData));
        });
    });
});
//# sourceMappingURL=content_migrations.test.js.map