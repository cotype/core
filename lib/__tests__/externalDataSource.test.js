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
const supertest_1 = __importDefault(require("supertest"));
const models_1 = __importDefault(require("./models"));
const util_1 = require("./util");
const __1 = require("..");
const FsStorage_1 = __importDefault(require("../media/storage/FsStorage"));
const local_thumbnail_provider_1 = __importDefault(require("@cotype/local-thumbnail-provider"));
let base = 0;
function createId() {
    return `some_id_${base++}`;
}
const uploadDir = path_1.default.join(__dirname, ".uploads");
const newsModel = models_1.default.find(({ name }) => name === "news");
const pagesModel = models_1.default.find(({ name }) => name === "pages");
const productsModel = models_1.default.find(({ name }) => name === "products");
const adminUser = {
    id: 1,
    name: "Administrator"
};
const listParams = {
    limit: 50,
    offset: 0
};
const newsSource = {
    contentTypes: ["news"],
    list: jest.fn(),
    load: jest.fn(),
    loadInternal: jest.fn(),
    loadItem: jest.fn(),
    find: jest.fn(),
    findInternal: jest.fn()
};
const pagesSource = {
    contentTypes: ["pages"],
    list: jest.fn(),
    load: jest.fn(),
    loadInternal: jest.fn(),
    loadItem: jest.fn(),
    find: jest.fn(),
    findInternal: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn()
};
const productsSource = {
    contentTypes: ["products"],
    list: jest.fn(),
    load: jest.fn(),
    loadInternal: jest.fn(),
    loadItem: jest.fn(),
    find: jest.fn(),
    findInternal: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    listVersions: jest.fn(),
    loadRevision: jest.fn(),
    publishRevision: jest.fn(),
    createRevision: jest.fn(),
    schedule: jest.fn()
};
describe("external data source support", () => {
    let headers;
    let app;
    let persistence;
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
            externalDataSources: [newsSource, pagesSource, productsSource]
        }));
        server = (0, supertest_1.default)(app);
        const { headers: h } = yield (0, util_1.login)(server, "admin@cotype.dev", "admin");
        headers = h;
    }));
    afterAll(() => {
        return persistence.shutdown();
    });
    describe("with ReadOnlyDataSource", () => {
        it("reads a list", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = {
                total: 5000,
                items: [{ foo: "bar" }, { baz: "brrt" }]
            };
            newsSource.list = jest.fn(() => Promise.resolve(response));
            const res = yield server
                .get(`/admin/rest/content/news`)
                .set(headers)
                .expect(200);
            yield expect(newsSource.list).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(newsModel), expect.objectContaining(listParams), undefined);
            yield expect(res.body).toEqual(response);
        }));
        it("receives list params", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = {
                total: 0,
                items: []
            };
            newsSource.list = jest.fn(() => Promise.resolve(response));
            const query = {
                offset: "2",
                limit: "500",
                search: { term: "foo", scope: "title" }
            };
            const res = yield server
                .get(`/admin/rest/content/news`)
                .set(headers)
                .query(query)
                .expect(200);
            yield expect(newsSource.list).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(newsModel), expect.objectContaining(query), undefined);
            yield expect(res.body).toEqual(response);
        }));
        it("reads a single item", () => __awaiter(void 0, void 0, void 0, function* () {
            const someID = "77";
            const response = { foo: "bar" };
            newsSource.loadInternal = jest.fn(() => Promise.resolve(response));
            const res = yield server
                .get(`/admin/rest/content/news/${someID}`)
                .set(headers)
                .expect(200);
            yield expect(newsSource.loadInternal).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(newsModel), someID);
            yield expect(res.body).toEqual(response);
        }));
        it("gracefully fails on write attempts", () => {
            return server
                .post(`/admin/rest/content/news`)
                .set(headers)
                .send({ foo: "bar" })
                .expect(404);
        });
    });
    describe("with WritableDataSource", () => {
        it("creates an item", () => __awaiter(void 0, void 0, void 0, function* () {
            const id = createId();
            const data = { title: "bar" };
            pagesSource.create = jest.fn(() => Promise.resolve({ id, data }));
            const res = yield server
                .post(`/admin/rest/content/pages`)
                .set(headers)
                .send({ data })
                .expect(200);
            yield expect(pagesSource.create).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(pagesModel), data, expect.anything());
            yield expect(res.body.id).toBe(id);
        }));
        it("deletes an item", () => __awaiter(void 0, void 0, void 0, function* () {
            const id = createId();
            pagesSource.delete = jest.fn();
            yield server
                .delete(`/admin/rest/content/pages/${id}`)
                .set(headers)
                .expect(204);
            yield expect(pagesSource.delete).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(pagesModel), id);
        }));
        it("updates an item", () => __awaiter(void 0, void 0, void 0, function* () {
            const id = createId();
            const response = { foo: "bar" };
            pagesSource.update = jest.fn(() => Promise.resolve(response));
            const title = "bar";
            const res = yield server
                .put(`/admin/rest/content/pages/${id}`)
                .set(headers)
                .send({
                title
            })
                .expect(200);
            yield expect(res.body).toEqual(response);
            yield expect(pagesSource.update).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(pagesModel), id, expect.objectContaining({
                title
            }), expect.anything());
        }));
    });
    describe("with VersionedDataSource", () => {
        it("lists versions", () => __awaiter(void 0, void 0, void 0, function* () {
            const data = [{ foo: "bar" }];
            const id = createId();
            productsSource.listVersions = jest.fn(() => Promise.resolve(data));
            const res = yield server
                .get(`/admin/rest/content/products/${id}/versions`)
                .set(headers)
                .expect(200);
            yield expect(productsSource.listVersions).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(productsModel), id);
            yield expect(res.body).toEqual(data);
        }));
        it("receives a single reversion", () => __awaiter(void 0, void 0, void 0, function* () {
            const data = { foo: "bar" };
            const id = createId();
            const rev = createId();
            productsSource.loadRevision = jest.fn(() => Promise.resolve(data));
            const res = yield server
                .get(`/admin/rest/content/products/${id}/versions/${rev}`)
                .set(headers)
                .expect(200);
            yield expect(productsSource.loadRevision).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(productsModel), id, rev);
            yield expect(res.body).toEqual(data);
        }));
        it("publishes a specific revision", () => __awaiter(void 0, void 0, void 0, function* () {
            const id = createId();
            const rev = createId();
            productsSource.publishRevision = jest.fn();
            yield server
                .post(`/admin/rest/content/products/${id}/publish`)
                .set(headers)
                .send({ rev })
                .expect(204);
            yield expect(productsSource.publishRevision).toHaveBeenCalledWith(expect.objectContaining(adminUser), expect.objectContaining(productsModel), id, rev, expect.anything());
        }));
    });
});
//# sourceMappingURL=externalDataSource.test.js.map