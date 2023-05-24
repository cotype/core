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
const { view, edit, publish } = acl_1.Permission;
const uploadDir = path_1.default.join(__dirname, ".uploads");
describe("api", () => {
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
    describe("unauthenticated", () => {
        it("protects setting/user route", () => {
            return (0, supertest_1.default)(app)
                .get("/admin/rest/settings/user")
                .expect(403);
        });
        it("allows content", () => {
            return (0, supertest_1.default)(app)
                .get("/rest/published/news")
                .expect(200);
        });
    });
    describe("authenticated", () => {
        let headers;
        let server;
        beforeEach(async () => ({ server, headers } = await (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin")));
        it("provides user data", async () => {
            const { body } = await server.get("/admin/rest/info").set(headers);
            expect(body).toMatchObject({
                user: expect.objectContaining({
                    name: "Administrator"
                })
            });
        });
        it("does not provide a users password", async () => {
            const { body: { user } } = await server.get("/admin/rest/info").set(headers);
            expect(user).not.toHaveProperty("password");
        });
    });
    describe("with limited access", () => {
        let server;
        let headers;
        const create = async (type, title = "Test") => {
            const { body } = await server
                .post(`/admin/rest/content/${type}`)
                .set(headers)
                .send({ data: { title } })
                .expect(200);
            return body.id;
        };
        beforeAll(async () => ({ headers, server } = await (0, util_1.withTempRole)((0, supertest_1.default)(app), {
            settings: false,
            content: {
                "*": view,
                products: view | edit,
                pages: view | edit | publish // tslint:disable-line:no-bitwise
            }
        })));
        it("gets the model definition", async () => {
            const res = await server
                .get("/admin/rest/info")
                .set(headers)
                .expect(200);
            expect(res.body).toMatchObject({
                models: {
                    settings: expect.any(Array),
                    content: expect.any(Array)
                }
            });
        });
        it("protects settings", () => {
            return server
                .get("/admin/rest/settings/users")
                .set(headers)
                .expect(403);
        });
        it("can read news", () => {
            return server
                .get("/admin/rest/content/news")
                .set(headers)
                .expect(200);
        });
        it("can not edit news", () => {
            return server
                .post("/admin/rest/content/news")
                .set(headers)
                .send({
                data: {
                    title: "Test",
                    slug: "test"
                }
            })
                .expect(403);
        });
        it("can not publish products", async () => {
            const id = await create("products");
            await server
                .post(`/admin/rest/content/products/${id}/publish`)
                .set(headers)
                .send({ rev: 1 })
                .expect(403);
            return server
                .get(`/rest/published/products/${id}`)
                .set(headers)
                .expect(404);
        });
        it("can publish pages", async () => {
            const id = await create("pages", "to be published");
            const res = await server
                .get(`/admin/rest/content/pages/${id}/versions`)
                .set(headers);
            const [latest] = res.body;
            await server
                .post(`/admin/rest/content/pages/${id}/publish`)
                .set(headers)
                .send({ rev: latest.rev })
                .expect(204);
            return server
                .get(`/rest/published/pages/${id}`)
                .set(headers)
                .expect(200);
        });
        it("keeps older published revision still available", async () => {
            const id = await create("pages", "First-Title");
            const res = await server
                .get(`/admin/rest/content/pages/${id}/versions`)
                .set(headers);
            const [latest] = res.body;
            await server
                .post(`/admin/rest/content/pages/${id}/publish`)
                .set(headers)
                .send({ rev: latest.rev })
                .expect(204);
            await server
                .get(`/rest/published/pages/${id}`)
                .set(headers)
                .expect(200);
            const { body: { total: total1 } } = await server
                .get(`/rest/published/pages?offset=0&limit=50&data.title[eq]=First-Title`)
                .set(headers)
                .expect(200);
            expect(total1).toBe(1);
            await server
                .put(`/admin/rest/content/pages/${id}`)
                .set(headers)
                .send({
                data: {
                    title: "Second-Title"
                }
            })
                .expect(200);
            const { body: { total: total2 } } = await server
                .get(`/rest/published/pages?offset=0&limit=50&data.title[eq]=First-Title`)
                .set(headers)
                .expect(200);
            expect(total2).toBe(1);
        });
        it("Should upload image", async () => {
            const imageBuffer = Buffer.from("Lorem Ipsum", "utf8");
            const { body: firstBody } = await server
                .post(`/admin/rest/upload`)
                .set(headers)
                .attach("file", imageBuffer, "lorem.test")
                .expect(200);
            expect(firstBody.files).toHaveLength(1);
            expect(firstBody.duplicates).toHaveLength(0);
            const { body: secondBody } = await server
                .post(`/admin/rest/upload`)
                .set(headers)
                .attach("file", imageBuffer, "lorem.test")
                .expect(200);
            expect(secondBody.files).toHaveLength(1);
            expect(secondBody.duplicates).toHaveLength(1);
        });
        it("Should recognize duplicate file uploads", async () => {
            const imageBuffer = Buffer.from("Lorem Ipsum Duplicadum", "utf8");
            const { body: firstResponse } = await server
                .post(`/admin/rest/upload`)
                .set(headers)
                .attach("file", imageBuffer, "lorem.test")
                .expect(200);
            expect(firstResponse.files).toHaveLength(1);
            expect(firstResponse.duplicates).toHaveLength(0);
            const { body: secondResponse } = await server
                .post(`/admin/rest/upload`)
                .set(headers)
                .attach("file", imageBuffer, "lorem.test")
                .expect(200);
            expect(secondResponse.files).toHaveLength(1);
            expect(secondResponse.duplicates).toHaveLength(1);
            const imageBuffer2 = Buffer.from("Lorem Ipsum Duplicadum 2", "utf8");
            const imageBuffer3 = Buffer.from("Lorem Ipsum Duplicadum 3", "utf8");
            const { body: thirdResponse } = await server
                .post(`/admin/rest/upload`)
                .set(headers)
                .attach("file", imageBuffer, "lorem.test")
                .attach("file", imageBuffer2, "lorem2.test")
                .attach("file", imageBuffer3, "lorem3.test")
                .expect(200);
            expect(thirdResponse.files).toHaveLength(3);
            expect(thirdResponse.duplicates).toHaveLength(1);
        });
    });
});
//# sourceMappingURL=api.test.js.map