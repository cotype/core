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
const FsStorage_1 = __importDefault(require("../media/storage/FsStorage"));
const local_thumbnail_provider_1 = __importDefault(require("@cotype/local-thumbnail-provider"));
const uploadDir = path_1.default.join(__dirname, ".uploads");
describe("content hooks", () => {
    let app;
    let persistence;
    let headers;
    let server;
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
            }),
            contentHooks: {
                preHooks: {
                    onCreate: (m, d) => __awaiter(void 0, void 0, void 0, function* () {
                        if (d.title === "throw error")
                            return Promise.reject("Catch me if you can");
                        return { customOnCreateHookData: true };
                    }),
                    onSave: (m, d) => __awaiter(void 0, void 0, void 0, function* () {
                        if (d.title === "throw error")
                            return Promise.reject("Catch me if you can");
                        return { customOnSaveHookData: true };
                    })
                }
            }
        }));
        ({ server, headers } = yield (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin"));
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield fs_extra_1.default.remove(uploadDir);
        return persistence.shutdown();
    }));
    const create = (type, data) => __awaiter(void 0, void 0, void 0, function* () {
        const { body } = yield server
            .post(`/admin/rest/content/${type}`)
            .set(headers)
            .send({ data })
            .expect(200);
        return body.id;
    });
    const update = (type, id, data) => __awaiter(void 0, void 0, void 0, function* () {
        const { body } = yield server
            .put(`/admin/rest/content/${type}/${id}`)
            .set(headers)
            .send(Object.assign({}, data))
            .expect(200);
        return body.id;
    });
    const get = (type, id) => __awaiter(void 0, void 0, void 0, function* () {
        const { body } = yield server
            .get(`/admin/rest/content/${type}/${id}`)
            .set(headers)
            .expect(200);
        return body;
    });
    it("should apply onCreate hook", () => __awaiter(void 0, void 0, void 0, function* () {
        const id = yield create("products", { title: "title" });
        const { data } = yield get("products", id);
        yield expect(data).toMatchObject({ customOnCreateHookData: true });
    }));
    it("should apply onSave hook", () => __awaiter(void 0, void 0, void 0, function* () {
        const id = yield create("products", { title: "title" });
        yield update("products", id, { title: "updated title" });
        const { data } = yield get("products", id);
        yield expect(data).toMatchObject({ customOnSaveHookData: true });
    }));
    it("should gracefully handle failing hooks", () => __awaiter(void 0, void 0, void 0, function* () {
        const id = yield create("products", {
            title: "throw error"
        });
        yield update("products", id, {
            title: "throw error"
        });
    }));
});
//# sourceMappingURL=preHooks.test.js.map