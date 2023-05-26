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
const acl_1 = require("../auth/acl");
const FsStorage_1 = __importDefault(require("../media/storage/FsStorage"));
const local_thumbnail_provider_1 = __importDefault(require("@cotype/local-thumbnail-provider"));
const apiHelper_1 = require("../content/rest/__tests__/apiHelper");
const { view, edit, publish } = acl_1.Permission;
const uploadDir = path_1.default.join(__dirname, ".uploads");
const itemShape = {
    author_name: expect.any(String),
    date: expect.any(String),
    id: expect.any(Number),
    kind: expect.any(String),
    model: expect.any(String),
    orderValue: expect.any(String),
    title: expect.any(String),
    type: expect.any(String)
};
describe("dashboard api", () => {
    let app;
    let persistence;
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
            })
        }));
    });
    afterAll(async () => {
        await fs_extra_1.default.remove(uploadDir);
        return persistence.shutdown();
    });
    describe("dashboard", () => {
        let headersAdmin;
        let server;
        let headersLimited;
        let serverLimited;
        beforeAll(async () => {
            ({ headers: headersLimited, server: serverLimited } = await (0, util_1.withTempRole)((0, supertest_1.default)(app), {
                settings: false,
                content: {
                    pages: view | edit | publish // tslint:disable-line:no-bitwise
                }
            }));
            let { create } = (0, apiHelper_1.createApiWriteHelpers)(serverLimited, headersLimited);
            await create("pages", { title: "Foo" });
            ({ server, headers: headersAdmin } = await (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin"));
            ({ create } = (0, apiHelper_1.createApiWriteHelpers)(server, headersAdmin));
            await create("products", { title: "Bar" });
        });
        it("provides dashboard data", async () => {
            const { body: unpublished } = await server
                .get("/admin/rest/dashboard/unpublished")
                .set(headersAdmin)
                .expect(200);
            expect(unpublished).toStrictEqual({
                total: 2,
                items: [
                    expect.objectContaining(itemShape),
                    expect.objectContaining(itemShape)
                ]
            });
            const { body: updated } = await server
                .get("/admin/rest/dashboard/updated")
                .set(headersAdmin)
                .expect(200);
            expect(updated).toStrictEqual({
                total: 2,
                items: [
                    expect.objectContaining(itemShape),
                    expect.objectContaining(itemShape)
                ]
            });
            const { body: updatedByMe } = await server
                .get("/admin/rest/dashboard/updated-by-user")
                .set(headersAdmin)
                .expect(200);
            expect(updatedByMe).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
        });
        it("provides limited dashboard data with limited access rights", async () => {
            const { body: unpublished } = await serverLimited
                .get("/admin/rest/dashboard/unpublished")
                .set(headersLimited)
                .expect(200);
            expect(unpublished).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
            const { body: updated } = await serverLimited
                .get("/admin/rest/dashboard/updated")
                .set(headersLimited)
                .expect(200);
            expect(updated).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
            const { body: updatedByMe } = await serverLimited
                .get("/admin/rest/dashboard/updated-by-user")
                .set(headersLimited)
                .expect(200);
            expect(updatedByMe).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
        });
    });
});
//# sourceMappingURL=dashboard.test.js.map