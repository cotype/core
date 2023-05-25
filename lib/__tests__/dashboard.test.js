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
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const storage = new FsStorage_1.default(uploadDir);
        ({ app, persistence } = yield (0, __1.init)({
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
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield fs_extra_1.default.remove(uploadDir);
        return persistence.shutdown();
    }));
    describe("dashboard", () => {
        let headersAdmin;
        let server;
        let headersLimited;
        let serverLimited;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            ({ headers: headersLimited, server: serverLimited } = yield (0, util_1.withTempRole)((0, supertest_1.default)(app), {
                settings: false,
                content: {
                    pages: view | edit | publish // tslint:disable-line:no-bitwise
                }
            }));
            let { create } = (0, apiHelper_1.createApiWriteHelpers)(serverLimited, headersLimited);
            yield create("pages", { title: "Foo" });
            ({ server, headers: headersAdmin } = yield (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin"));
            ({ create } = (0, apiHelper_1.createApiWriteHelpers)(server, headersAdmin));
            yield create("products", { title: "Bar" });
        }));
        it("provides dashboard data", () => __awaiter(void 0, void 0, void 0, function* () {
            const { body: unpublished } = yield server
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
            const { body: updated } = yield server
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
            const { body: updatedByMe } = yield server
                .get("/admin/rest/dashboard/updated-by-user")
                .set(headersAdmin)
                .expect(200);
            expect(updatedByMe).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
        }));
        it("provides limited dashboard data with limited access rights", () => __awaiter(void 0, void 0, void 0, function* () {
            const { body: unpublished } = yield serverLimited
                .get("/admin/rest/dashboard/unpublished")
                .set(headersLimited)
                .expect(200);
            expect(unpublished).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
            const { body: updated } = yield serverLimited
                .get("/admin/rest/dashboard/updated")
                .set(headersLimited)
                .expect(200);
            expect(updated).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
            const { body: updatedByMe } = yield serverLimited
                .get("/admin/rest/dashboard/updated-by-user")
                .set(headersLimited)
                .expect(200);
            expect(updatedByMe).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
        }));
    });
});
//# sourceMappingURL=dashboard.test.js.map