"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const tempy_1 = __importDefault(require("tempy"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const supertest_1 = __importDefault(require("supertest"));
const __1 = require("..");
const models_1 = __importDefault(require("./models"));
const util_1 = require("./util");
const FsStorage_1 = __importDefault(require("../media/storage/FsStorage"));
const local_thumbnail_provider_1 = __importDefault(require("@cotype/local-thumbnail-provider"));
const uploadDir = path_1.default.join(__dirname, ".uploads");
describe("content hooks", () => {
    let app;
    let persistence;
    let headers;
    let server;
    beforeAll(async () => {
        const storage = new FsStorage_1.default(uploadDir);
        ({ app, persistence } = await (0, __1.init)({
            models: models_1.default,
            storage,
            thumbnailProvider: new local_thumbnail_provider_1.default(storage),
            persistenceAdapter: (0, __1.knexAdapter)({
                client: "sqlite3",
                connection: {
                    filename: tempy_1.default.file()
                },
                useNullAsDefault: true
            }),
            contentHooks: {
                preHooks: {
                    onCreate: async (m, d) => {
                        if (d.title === "throw error")
                            return Promise.reject("Catch me if you can");
                        return { customOnCreateHookData: true };
                    },
                    onSave: async (m, d) => {
                        if (d.title === "throw error")
                            return Promise.reject("Catch me if you can");
                        return { customOnSaveHookData: true };
                    }
                }
            }
        }));
        ({ server, headers } = await (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin"));
    });
    afterAll(async () => {
        await fs_extra_1.default.remove(uploadDir);
        return persistence.shutdown();
    });
    const create = async (type, data) => {
        const { body } = await server
            .post(`/admin/rest/content/${type}`)
            .set(headers)
            .send({ data })
            .expect(200);
        return body.id;
    };
    const update = async (type, id, data) => {
        const { body } = await server
            .put(`/admin/rest/content/${type}/${id}`)
            .set(headers)
            .send(Object.assign({}, data))
            .expect(200);
        return body.id;
    };
    const get = async (type, id) => {
        const { body } = await server
            .get(`/admin/rest/content/${type}/${id}`)
            .set(headers)
            .expect(200);
        return body;
    };
    it("should apply onCreate hook", async () => {
        const id = await create("products", { title: "title" });
        const { data } = await get("products", id);
        await expect(data).toMatchObject({ customOnCreateHookData: true });
    });
    it("should apply onSave hook", async () => {
        const id = await create("products", { title: "title" });
        await update("products", id, { title: "updated title" });
        const { data } = await get("products", id);
        await expect(data).toMatchObject({ customOnSaveHookData: true });
    });
    it("should gracefully handle failing hooks", async () => {
        const id = await create("products", {
            title: "throw error"
        });
        await update("products", id, {
            title: "throw error"
        });
    });
});
//# sourceMappingURL=preHooks.test.js.map