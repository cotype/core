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
const tempy_1 = __importDefault(require("tempy"));
const knex_1 = __importDefault(require("../knex"));
const models_1 = __importDefault(require("./models"));
const model_1 = __importDefault(require("../../../model"));
const ReferenceConflictError_1 = __importDefault(require("../../errors/ReferenceConflictError"));
const UniqueFieldError_1 = __importDefault(require("../../errors/UniqueFieldError"));
const models = (0, model_1.default)(models_1.default);
const roles = models.settings.find(m => m.name === "roles");
const users = models.settings.find(m => m.name === "users");
const news = models.content[0];
const pages = models.content[1];
const uniqueContent = models.content[2];
const indexContent = models.content[3];
const positionContent = models.content[4];
const implementations = [
    [
        "knex",
        (0, knex_1.default)({
            client: "sqlite3",
            connection: {
                filename: tempy_1.default.file()
            },
            useNullAsDefault: true
        })
    ]
];
if (process.env.DB) {
    implementations.push([
        "mysql",
        (0, knex_1.default)({
            client: "mysql",
            connection: process.env.DB
        })
    ]);
}
describe.each(implementations)("%s adapter", (_, impl) => {
    let adapter;
    let settings;
    let content;
    let media;
    const permissions = {
        settings: true,
        content: {
            "*": 7
        }
    };
    const createRole = (name) => settings.create(roles, {
        name,
        permissions
    });
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        adapter = (yield impl);
        settings = adapter.settings;
        content = adapter.content;
        media = adapter.media;
        expect.extend({
            toBeGreaterThanString(received, expected) {
                const pass = received > expected;
                if (pass) {
                    return {
                        message: () => `expected ${received} to be lower than ${expected}`,
                        pass: true
                    };
                }
                else {
                    return {
                        message: () => `expected ${received} to be greater than ${expected}`,
                        pass: false
                    };
                }
            }
        });
    }));
    afterAll(() => adapter.shutdown());
    describe("settings", () => {
        it("should create roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const id = yield createRole("create-role-test");
            expect(id).toBeGreaterThan(0);
        }));
        it("should list roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const name = "list-role-test";
            const id = yield createRole(name);
            const res = yield settings.list(roles, {});
            yield expect(res).toMatchObject({
                items: expect.arrayContaining([expect.objectContaining({ id, name })])
            });
        }));
        it("should load roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const name = "load-role-test";
            const id = yield createRole(name);
            const res = yield settings.load(roles, id);
            yield expect(res).toMatchObject({ id, name });
        }));
        it("should find roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const name = "find-role-test";
            const id = yield createRole(name);
            const res = yield settings.find(roles, "name", name);
            yield expect(res).toMatchObject({ id, name });
        }));
        it("should delete roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const name = "find-role-test";
            const id = yield createRole(name);
            const res = yield settings.delete(roles, id);
            yield expect(res).toEqual(1);
        }));
        it("should not delete roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const name = "find-role-test";
            const role = yield createRole(name);
            yield settings.create(users, {
                role,
                name: "not-delectable",
                email: "role-should-not-be-delectable@example.com",
                password: "xxx"
            });
            yield expect(settings.delete(roles, role)).rejects.toBeInstanceOf(Error);
        }));
        it("should create users", () => __awaiter(void 0, void 0, void 0, function* () {
            const role = yield createRole("create-user-test");
            const id = yield settings.create(users, {
                role,
                name: "create-test",
                email: "create-test@example.com",
                password: "xxx"
            });
            yield expect(id).toBeGreaterThan(0);
        }));
        it("should delete users", () => __awaiter(void 0, void 0, void 0, function* () {
            const role = yield createRole("delete-user-test");
            const id = yield settings.create(users, {
                role,
                name: "delete-test",
                email: "delete-test@example.com",
                password: "xxx"
            });
            const data = { title: "News" };
            // create content with user for a foreign key constraint
            yield content.create(data, data, news, models.content, id);
            yield settings.deleteUser(id);
            const userList = yield settings.list(users, {});
            yield expect(userList.items).not.toContainEqual(expect.objectContaining({ id }));
            yield expect(yield settings.loadUser(id)).toBeNull();
        }));
        it("should load user with permissions", () => __awaiter(void 0, void 0, void 0, function* () {
            const role = yield createRole("load-user-test");
            const id = yield settings.create(users, {
                role,
                name: "load-test",
                email: "load-test@example.com",
                password: "xxx"
            });
            const user = yield settings.loadUser(id);
            yield expect(user).toMatchObject({
                name: "load-test",
                role,
                permissions
            });
        }));
    });
    describe("content", () => {
        const sampleNews = {
            title: "Sample news",
            date: "2018-09-13",
            text: {
                ops: [{ insert: "Hello world" }]
            },
            inverseRef: []
        };
        let author;
        const createNews = (...data) => {
            return Promise.all(data.map(d => content.create(Object.assign(Object.assign({}, sampleNews), d), Object.assign(Object.assign({}, sampleNews), d), news, models.content, author)));
        };
        const samplePage = {
            title: "Sample page"
        };
        const createPages = (...data) => {
            return Promise.all(data.map(d => content.create(Object.assign(Object.assign({}, samplePage), d), Object.assign(Object.assign({}, samplePage), d), pages, models.content, author)));
        };
        const createIndexContent = (...data) => {
            return Promise.all(data.map(d => content.create(Object.assign({}, d), Object.assign({}, d), indexContent, models.content, author)));
        };
        const createPositionContent = (...data) => {
            return Promise.all(data.map(d => content.create(Object.assign({}, d), Object.assign({}, d), positionContent, models.content, author)));
        };
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            const role = yield createRole("author");
            author = yield settings.create(users, {
                role,
                name: "Test Author",
                email: "author@example.com",
                password: "xxx"
            });
        }));
        it("should create content", () => __awaiter(void 0, void 0, void 0, function* () {
            const [id] = yield createNews({});
            yield expect(id).toBeGreaterThan(0);
        }));
        it("should create a revision", () => __awaiter(void 0, void 0, void 0, function* () {
            const [id] = yield createNews({});
            const data = Object.assign(Object.assign({}, sampleNews), { title: "Updated" });
            const rev = yield content.createRevision(data, data, news, models.content, id, author);
            yield expect(rev).toBeGreaterThan(0);
        }));
        it("should load content", () => __awaiter(void 0, void 0, void 0, function* () {
            const [id] = yield createNews({});
            const cnt = yield content.load(news, id);
            yield expect(cnt).toMatchObject({
                id,
                type: "news",
                data: sampleNews
            });
        }));
        it("should load revisions", () => __awaiter(void 0, void 0, void 0, function* () {
            const [id] = yield createNews({});
            const rev = yield content.loadRevision(news, id, 1);
            yield expect(rev).toMatchObject({
                id,
                rev: 1,
                data: sampleNews
            });
        }));
        it("should list versions", () => __awaiter(void 0, void 0, void 0, function* () {
            const [id] = yield createNews({});
            const data = Object.assign(Object.assign({}, sampleNews), { title: "Updated" });
            yield content.createRevision(data, data, news, models.content, id, author);
            const revs = yield content.listVersions(news, id);
            yield expect(revs).toMatchObject([
                {
                    id,
                    rev: 2,
                    type: "news",
                    author_name: "Test Author",
                    published: false,
                    latest: true
                },
                {
                    id,
                    rev: 1,
                    type: "news",
                    author_name: "Test Author",
                    published: false,
                    latest: false
                }
            ]);
        }));
        describe("publish", () => {
            it("should succeed", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [latest] = yield content.listVersions(news, newsId);
                yield expect(latest.published).toBe(true);
            }));
            it("should fail if referencing unpublished content", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield expect(content.setPublishedRev(pages, pageId, 1, models.content)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            }));
            it("should succeed if referencing published content", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                const [latest] = yield content.listVersions(pages, pageId);
                yield expect(latest.published).toBe(true);
            }));
            it("should fail if referencing scheduled content that is still invisible", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                yield content.schedule(news, newsId, {
                    visibleFrom: new Date(Date.now() + 600000)
                });
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield expect(content.setPublishedRev(pages, pageId, 1, models.content)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            }));
            it("should fail if referencing content that will become invisible", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                yield content.schedule(news, newsId, {
                    visibleUntil: new Date(Date.now() + 600000)
                });
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield expect(content.setPublishedRev(pages, pageId, 1, models.content)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            }));
            it("should succeed if reference is optional", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                const [pageId] = yield createPages({
                    optionalNews: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
            }));
        });
        describe("unpublish", () => {
            it("should fail if referenced by published content", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                yield expect(content.setPublishedRev(news, newsId, null, models.content)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            }));
            it("should succeed if referrer is unpublished first", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                yield content.setPublishedRev(pages, pageId, null, models.content);
                yield content.setPublishedRev(news, newsId, null, models.content);
            }));
            it("should succeed if referrer is deleted first", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                yield content.delete(pages, pageId);
                yield content.setPublishedRev(news, newsId, null, models.content);
            }));
            it("should succeed if reference is optional", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    optionalNews: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                yield content.setPublishedRev(news, newsId, null, models.content);
            }));
        });
        describe("delete", () => {
            it("should fail if referenced by published content", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                yield expect(content.delete(news, newsId)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            }));
            it("should succeed if referenced by unpublished content", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                yield expect(content.delete(news, newsId)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
                yield content.setPublishedRev(pages, pageId, null, models.content);
                yield content.delete(news, newsId);
            }));
            it("should succeed if referenced by published but expired content", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                yield content.schedule(pages, pageId, {
                    visibleUntil: new Date(Date.now() - 1000)
                });
                yield content.delete(news, newsId);
            }));
        });
        describe("schedule", () => {
            it("should succeed if visible after refs", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                yield content.schedule(news, newsId, {
                    visibleFrom: new Date(Date.now() + 300000)
                });
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.schedule(pages, pageId, {
                    visibleFrom: new Date(Date.now() + 600000)
                });
            }));
            it("should fail if visible before refs", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                yield content.schedule(news, newsId, {
                    visibleFrom: new Date(Date.now() + 600000)
                });
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield expect(content.schedule(pages, pageId, {
                    visibleFrom: new Date(Date.now() + 300000)
                })).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            }));
            it("should succeed if expires before refs", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                yield content.schedule(news, newsId, {
                    visibleUntil: new Date(Date.now() + 600000)
                });
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.schedule(pages, pageId, {
                    visibleUntil: new Date(Date.now() + 300000)
                });
            }));
            it("should fail if expires after refs", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                yield content.schedule(news, newsId, {
                    visibleUntil: new Date(Date.now() + 300000)
                });
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield expect(content.schedule(pages, pageId, {
                    visibleUntil: new Date(Date.now() + 600000)
                })).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            }));
            it("should fail if content expires before a referring content", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                yield content.setPublishedRev(news, newsId, 1, models.content);
                const [pageId] = yield createPages({
                    news: { id: newsId, model: "news" }
                });
                yield content.setPublishedRev(pages, pageId, 1, models.content);
                yield expect(content.schedule(news, newsId, {
                    visibleUntil: new Date(Date.now() + 300000)
                })).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            }));
        });
        describe("list", () => {
            let ids;
            let indexContentIds = [];
            beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
                ids = yield createNews({}, { title: "Test2" }, {});
                indexContentIds = yield createIndexContent({ name: "CCC", slug: "AAA", test: "AAA" }, { name: "AAA", slug: "CCC", test: "CCC" }, { name: "BBB", slug: "BBB", test: "BBB" });
            }));
            it("should list content", () => __awaiter(void 0, void 0, void 0, function* () {
                const cnt = yield content.list(news, models.content);
                yield expect(cnt.total).toBeGreaterThan(2);
                yield expect(cnt).toMatchObject({
                    items: expect.arrayContaining([
                        expect.objectContaining({ id: ids[0], data: sampleNews }),
                        expect.objectContaining({ id: ids[1] }),
                        expect.objectContaining({ id: ids[2], data: sampleNews })
                    ])
                });
            }));
            it("should list content ordered by title", () => __awaiter(void 0, void 0, void 0, function* () {
                yield createNews({ title: "abc", date: "2050-01-01" }, { title: "bcd", date: "2050-01-01" }, { title: "ABC", date: "2050-01-01" }, { title: "BCD", date: "2050-01-01" });
                const find = (order) => content.list(news, models.content, { order, orderBy: "title" }, {
                    "data.date": { eq: "2050-01-01" }
                });
                const listAsc = yield find("asc");
                const ascTitles = listAsc.items.map(i => i.data.title);
                yield expect(ascTitles).toEqual(["abc", "ABC", "bcd", "BCD"]);
                const listDesc = yield find("desc");
                const descTitles = listDesc.items.map(i => i.data.title);
                yield expect(descTitles).toEqual(["bcd", "BCD", "abc", "ABC"]);
            }));
            it("auto indexed field (title) should be name", () => __awaiter(void 0, void 0, void 0, function* () {
                expect(indexContent.title).toBe("name");
            }));
            it("could be sort by auto indexed field (title)", () => __awaiter(void 0, void 0, void 0, function* () {
                const find = (order) => content.list(indexContent, models.content, {
                    order,
                    orderBy: indexContent.title
                });
                const listAsc = yield find("asc");
                const ascTitles = listAsc.items.map(i => i.data.name);
                yield expect(ascTitles).toEqual(["AAA", "BBB", "CCC"]);
                const listDesc = yield find("desc");
                const descTitles = listDesc.items.map(i => i.data.name);
                yield expect(descTitles).toEqual(["CCC", "BBB", "AAA"]);
            }));
            it("could be sort by auto indexed field (uniqueField)", () => __awaiter(void 0, void 0, void 0, function* () {
                const find = (order) => content.list(indexContent, models.content, {
                    order,
                    orderBy: indexContent.uniqueFields
                        ? indexContent.uniqueFields[0]
                        : ""
                });
                const listAsc = yield find("asc");
                const ascTitles = listAsc.items.map(i => i.data.slug);
                yield expect(ascTitles).toEqual(["AAA", "BBB", "CCC"]);
                const listDesc = yield find("desc");
                const descTitles = listDesc.items.map(i => i.data.slug);
                yield expect(descTitles).toEqual(["CCC", "BBB", "AAA"]);
            }));
            it("could not be sort by not indexed field instead sort id", () => __awaiter(void 0, void 0, void 0, function* () {
                const find = (order) => content.list(indexContent, models.content, {
                    order,
                    orderBy: "test"
                });
                const listAsc = yield find("asc");
                const ascTitles = listAsc.items.map(i => i.id);
                yield expect(ascTitles).toEqual(indexContentIds);
                const listDesc = yield find("desc");
                const descTitles = listDesc.items.map(i => i.id);
                yield expect(descTitles).toEqual(indexContentIds.reverse());
            }));
            it("should list content ordered by id", () => __awaiter(void 0, void 0, void 0, function* () {
                const find = (order) => content.list(news, models.content, { order }, {
                    "data.date": { eq: "2050-01-01" }
                });
                const listAsc = yield find("asc");
                const idsAsc = listAsc.items.map(i => Number(i.id));
                yield expect(idsAsc).toEqual(idsAsc.sort((a, b) => a - b));
                const listDesc = yield find("desc");
                const idsDesc = listDesc.items.map(i => Number(i.id));
                yield expect(idsDesc).toEqual(idsAsc.sort((a, b) => b - a));
            }));
            it("should list content by searchTerm", () => __awaiter(void 0, void 0, void 0, function* () {
                const createdNewsIds = yield createNews({ title: "yaddi bar" }, { title: "YADDI bazinga" });
                const list = yield content.list(news, models.content, {
                    search: { term: "yad" }
                });
                yield expect(list.items).toHaveLength(2);
                yield expect(list.total).toBe(2);
                yield expect(list.items.map(i => i.id).sort()).toMatchObject(createdNewsIds.sort());
                const list2 = yield content.list(news, models.content, {
                    search: { term: "DDI" }
                });
                yield expect(list2.items).toHaveLength(2);
                yield expect(list2.total).toBe(2);
                yield expect(list2.items.map(i => i.id).sort()).toMatchObject(createdNewsIds.sort());
                const list3 = yield content.list(news, models.content, {
                    search: { term: "bazing" }
                });
                yield expect(list3.items).toHaveLength(1);
                yield expect(list3.total).toBe(1);
                yield expect(list3.items[0].data.title).toBe("YADDI bazinga");
            }));
            it("should support paging", () => __awaiter(void 0, void 0, void 0, function* () {
                const cnt = yield content.list(news, models.content);
                const i = cnt.items.findIndex(i2 => i2.id === ids[0]);
                const page = yield content.list(news, models.content, {
                    offset: i,
                    limit: 2
                });
                yield expect(page).toMatchObject({
                    total: cnt.total,
                    items: cnt.items.slice(i, i + 2)
                });
            }));
            it("should not list deleted content", () => __awaiter(void 0, void 0, void 0, function* () {
                const list = yield content.list(news, models.content);
                const first = list.items[0].id;
                yield content.delete(news, first);
                const altered = yield content.list(news, models.content);
                const e = expect;
                yield expect(altered).toMatchObject({
                    total: list.total - 1,
                    items: e.not.arrayContaining([{ id: first }])
                });
            }));
            it("should find content references", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                const [pageId] = yield createPages({
                    optionalNews: { id: newsId, model: "news" }
                });
                yield expect(yield content.loadContentReferences([pageId], pages, models.content)).toMatchObject([{ id: newsId }]);
            }));
            it("should not find deleted content references", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({});
                const [pageId] = yield createPages({
                    optionalNews: { id: newsId, model: "news" }
                });
                yield content.delete(news, newsId);
                yield expect(yield content.loadContentReferences([pageId], pages, models.content)).toMatchObject([]);
            }));
            it("should contain inverseReferences", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({ date: "2020-01-01" });
                const [pageId] = yield createPages({
                    optionalNews: { id: newsId, model: "news" }
                });
                const c = yield content.load(news, newsId, { publishedOnly: false });
                yield expect(c).toMatchObject({
                    data: {
                        date: "2020-01-01",
                        inverseRef: [
                            { _content: "pages", _id: String(pageId), _ref: "content" }
                        ],
                        text: {
                            ops: [
                                {
                                    insert: "Hello world"
                                }
                            ]
                        },
                        title: "Sample news"
                    },
                    id: newsId,
                    type: "news",
                    visibleFrom: null,
                    visibleUntil: null
                });
            }));
            it("should contain inverseReferences find", () => __awaiter(void 0, void 0, void 0, function* () {
                const [newsId] = yield createNews({ date: "2020-01-02" });
                const [pageId] = yield createPages({
                    optionalNews: { id: newsId, model: "news" }
                });
                const c = yield content.list(news, models.content, {}, {
                    "data.date": {
                        eq: "2020-01-02"
                    }
                }, { publishedOnly: false });
                yield expect(c.items[0]).toMatchObject({
                    data: {
                        date: "2020-01-02",
                        inverseRef: [
                            { _content: "pages", _id: String(pageId), _ref: "content" }
                        ],
                        text: {
                            ops: [
                                {
                                    insert: "Hello world"
                                }
                            ]
                        },
                        title: "Sample news"
                    },
                    id: newsId,
                    type: "news",
                    visibleFrom: null,
                    visibleUntil: null
                });
            }));
        });
        describe("query", () => {
            let ids;
            let pageIds;
            beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
                ids = yield createNews({
                    title: "Lorem ipsum dolor sit",
                    slug: "ipsum"
                }, {
                    title: "Find me",
                    date: "2018-09-30"
                }, {
                    title: "Find me too",
                    date: "2018-10-01"
                });
                const data1 = Object.assign(Object.assign({}, sampleNews), { title: "Lorem ipsum dolor" });
                // Create a second revision...
                const rev = yield content.createRevision(data1, data1, news, models.content, ids[0], author);
                const data2 = Object.assign(Object.assign({}, sampleNews), { title: "Lorem ipsum" });
                // ...and a third one
                yield content.createRevision(data2, data2, news, models.content, ids[0], author);
                // ...and publish it
                yield content.setPublishedRev(news, ids[0], rev, models.content);
                pageIds = yield createPages({
                    news: { id: ids[0], model: "news" },
                    newsList: [
                        { value: { id: ids[0], model: "news" } },
                        { value: { id: ids[2], model: "news" } }
                    ],
                    stringList: [{ value: "Find Me" }, { value: "or me" }]
                }, {
                    news: { id: ids[1], model: "news" },
                    newsList: [
                        { value: { id: ids[1], model: "news" } },
                        { value: { id: ids[2], model: "news" } }
                    ],
                    stringList: [{ value: "but not me" }, { value: "or me" }]
                });
            }));
            it("should query content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield expect(yield content.list(news, models.content, {}, {
                    "data.title": { eq: "Lorem ipsum" }
                })).toMatchObject({ total: 1, items: [{ id: ids[0] }] });
                yield expect(yield content.list(news, models.content, {}, {
                    "data.date": { gt: "2018-09-13", lt: "2018-10-01" }
                })).toMatchObject({
                    total: 1,
                    items: [{ id: ids[1] }]
                });
                yield expect(yield content.list(pages, models.content, {}, {
                    "data.news": { eq: ids[1] }
                })).toMatchObject({
                    total: 1,
                    items: [{ id: pageIds[1] }]
                });
                yield expect(yield content.list(pages, models.content, {}, {
                    "data.newsList": { eq: ids[1] }
                })).toMatchObject({
                    total: 1,
                    items: [{ id: pageIds[1] }]
                });
                yield expect(yield content.list(pages, models.content, {}, {
                    "data.stringList": { eq: "Find Me" }
                })).toMatchObject({
                    total: 1,
                    items: [{ id: pageIds[0] }]
                });
                const data3 = Object.assign(Object.assign({}, sampleNews), { title: "Don't find me" });
                // Update previously found content
                yield content.createRevision(data3, data3, news, models.content, ids[1], author);
                yield expect(yield content.list(news, models.content, {}, {
                    "data.title": { eq: "Find me" }
                })).toMatchObject({ total: 0 });
                // Query published content
                yield content.setPublishedRev(news, ids[2], 1, models.content);
                yield expect(yield content.list(news, models.content, {}, { "data.date": { gt: "2018-09-13" } }, { publishedOnly: true })).toMatchObject({
                    total: 1,
                    items: [{ id: ids[2] }]
                });
                // Unpublish
                yield content.setPublishedRev(news, ids[2], null, models.content);
                yield expect(yield content.list(news, models.content, {}, { "data.date": { gt: "2018-09-13" } }, { publishedOnly: true })).toMatchObject({ total: 0, items: [] });
            }));
            it("should search", () => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield content.search("ipsum lore", false, {});
                expect(res).toMatchObject({
                    total: 1,
                    items: [{ type: "news", data: { title: "Lorem ipsum" } }]
                });
            }));
            it("should not throw errors for specials chars in search", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.search(" ", true, {});
                yield content.search("+", true, {});
                yield content.search("-", true, {});
                yield content.search("~", true, {});
                yield content.search("(~)", true, {});
                yield content.search("hello- world ", true, {});
            }));
            it("should find content by media", () => __awaiter(void 0, void 0, void 0, function* () {
                const image = "image.png";
                yield media.create({
                    id: image,
                    size: 1234,
                    originalname: "image.png",
                    mimetype: "image/png",
                    imagetype: "png",
                    width: 100,
                    height: 100
                });
                const [id] = yield createNews({ image });
                expect(yield content.findByMedia(image)).toMatchObject([
                    { id, type: "news", data: { image } }
                ]);
            }));
        });
        describe("constraints", () => {
            it("should create content", () => __awaiter(void 0, void 0, void 0, function* () {
                const id = yield content.create({ slug: "unique" }, { slug: "unique" }, uniqueContent, models.content, author);
                yield expect(id).toBeGreaterThan(0);
            }));
            it("should not create content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield expect(content.create({ slug: "unique" }, { slug: "unique" }, uniqueContent, models.content, author)).rejects.toBeInstanceOf(UniqueFieldError_1.default);
            }));
            it("should be able to update content", () => __awaiter(void 0, void 0, void 0, function* () {
                const id = yield content.create({ slug: "foo-bar-baz" }, { slug: "foo-bar-baz" }, uniqueContent, models.content, author);
                yield expect(yield content.createRevision({ slug: "foo-bar-baz" }, { slug: "foo-bar-baz" }, uniqueContent, models.content, id, author)).not.toBeNaN();
            }));
        });
        describe("scheduled content", () => {
            let id;
            beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
                [id] = yield createNews({ title: "tttest" });
                yield content.setPublishedRev(news, id, 1, models.content);
            }));
            const expectToFindIt = (contains, previewOpts) => __awaiter(void 0, void 0, void 0, function* () {
                const list = yield content.list(news, models.content, {}, undefined, previewOpts);
                const e = contains ? expect : expect.not;
                yield expect(list).toMatchObject({
                    items: e.arrayContaining([expect.objectContaining({ id })])
                });
            });
            it("should show unscheduled content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield expectToFindIt(true, { publishedOnly: true });
            }));
            it("should hide future content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() + 600000)
                });
                yield expectToFindIt(false, { publishedOnly: true });
            }));
            it("should show future content if scheduled is ignored", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() + 100000)
                });
                yield expectToFindIt(true, {
                    publishedOnly: true,
                    ignoreSchedule: true
                });
            }));
            it("should show future content in preview", () => __awaiter(void 0, void 0, void 0, function* () {
                yield expectToFindIt(true, { publishedOnly: false });
            }));
            it("should show past content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() - 600000)
                });
                yield expectToFindIt(true, { publishedOnly: true });
            }));
            it("should load past content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() - 600000)
                });
                const c = yield content.load(news, id, { publishedOnly: true });
                expect(c).not.toBeNull();
            }));
            it("should not show expired content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() - 600000),
                    visibleUntil: new Date(Date.now() - 300000)
                });
                yield expectToFindIt(false, { publishedOnly: true });
            }));
            it("should not load expired content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() - 600000),
                    visibleUntil: new Date(Date.now() - 300000)
                });
                const c = yield content.load(news, id, { publishedOnly: true });
                expect(c).toBeNull();
            }));
            it("should not load future content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() + 600000)
                });
                const c = yield content.load(news, id, { publishedOnly: true });
                expect(c).toBeNull();
            }));
            it("should search past content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() - 600000)
                });
                const c = yield content.search("tttest", true, { models: ["news"] }, { publishedOnly: true });
                expect(c.total).toBe(1);
            }));
            it("should not search expired content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() - 600000),
                    visibleUntil: new Date(Date.now() - 300000)
                });
                const c = yield content.search("tttest", true, { models: ["news"] }, { publishedOnly: true });
                expect(c.total).toBe(0);
            }));
            it("should not search future content", () => __awaiter(void 0, void 0, void 0, function* () {
                yield content.schedule(news, id, {
                    visibleFrom: new Date(Date.now() + 600000)
                });
                const c = yield content.search("tttest", true, { models: ["news"] }, { publishedOnly: true });
                expect(c.total).toBe(0);
            }));
        });
        describe("migrations", () => {
            it("should rewrite data", () => __awaiter(void 0, void 0, void 0, function* () {
                const ids = yield createNews({
                    title: "News 1"
                }, {
                    title: "News 2"
                }, {
                    title: "News 3"
                });
                yield content.rewrite(news, models.content, (data, meta) => __awaiter(void 0, void 0, void 0, function* () {
                    if (ids.includes(meta.id)) {
                        return {
                            storeData: Object.assign(Object.assign({}, data), { title: data.title.toUpperCase() }),
                            searchData: {}
                        };
                    }
                }));
                const c = yield content.load(news, ids[0]);
                expect(c).toMatchObject({ data: { title: "NEWS 1" } });
            }));
            it("should perform a migration only once", () => __awaiter(void 0, void 0, void 0, function* () {
                const execute = jest.fn();
                const callback = jest.fn();
                yield content.migrate([{ name: "aaa", execute }], callback);
                yield content.migrate([{ name: "aaa", execute }], callback);
                expect(callback).toBeCalledTimes(1);
            }));
            it("should wait for migrations to finish", () => __awaiter(void 0, void 0, void 0, function* () {
                const execute = jest.fn();
                const callback = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
                yield Promise.all([
                    content.migrate([{ name: "bbb", execute }], callback),
                    content.migrate([{ name: "bbb", execute }], callback)
                ]);
                expect(callback).toBeCalledTimes(1);
            }));
        });
        describe("positions", () => {
            let ids = [];
            beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
                ids = yield createPositionContent({ title: "A", posit: "A" }, { title: "B", posit: "B" });
            }));
            it("should add position field, onCreate", () => __awaiter(void 0, void 0, void 0, function* () {
                const i = yield createPositionContent({ title: "C" });
                const c = (yield content.load(positionContent, i[0]));
                expect(c.data.posit).toBeGreaterThanString("B");
            }));
            it("should add position field, onUpdate", () => __awaiter(void 0, void 0, void 0, function* () {
                const data = { title: "B" };
                yield content.createRevision(data, data, positionContent, models.content, ids[1], author);
                const c = (yield content.load(positionContent, ids[1]));
                expect(c.data.posit).toBeGreaterThanString("B");
            }));
            it("should change position field when value exists", () => __awaiter(void 0, void 0, void 0, function* () {
                const i = yield createPositionContent({ title: "D", posit: "A" });
                const c = (yield content.load(positionContent, i[0]));
                expect(c.data.posit).toBeGreaterThanString("A");
                const data = { title: "D", posit: "A" };
                yield content.createRevision(data, data, positionContent, models.content, i[0], author);
                const c2 = (yield content.load(positionContent, i[0]));
                expect(c2.data.posit).toBeGreaterThanString("A");
            }));
            it("should keep position field when value exists on same id", () => __awaiter(void 0, void 0, void 0, function* () {
                const data = { title: "ABC", posit: "A" };
                yield content.createRevision(data, data, positionContent, models.content, ids[0], author);
                const c = (yield content.load(positionContent, ids[0]));
                expect(c.data.title).toBe("ABC");
                expect(c.data.posit).toBe("A");
            }));
        });
    });
    describe("media", () => {
        const image1 = {
            id: "1.jpg",
            size: 1000,
            originalname: "hello.jpg",
            mimetype: "image/jpeg",
            imagetype: "jpeg",
            width: 800,
            height: 600
        };
        const image2 = {
            id: "2.jpg",
            size: 1000,
            originalname: "world.jpg",
            mimetype: "image/jpeg",
            imagetype: "jpeg",
            width: 800,
            height: 600
        };
        const image3 = {
            id: "3.jpg",
            size: 1000,
            originalname: "delete-me.jpg",
            mimetype: "image/jpeg",
            imagetype: "jpeg",
            width: 800,
            height: 600
        };
        let author;
        beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
            yield media.create(image1);
            yield media.create(image2);
            yield media.create(image3);
            const role = yield createRole("media-test");
            author = yield settings.create(users, {
                role,
                name: "Media Test",
                email: "media@example.com",
                password: "xxx"
            });
        }));
        it("should create media", () => __awaiter(void 0, void 0, void 0, function* () {
            const image = {
                id: "createImage.jpg",
                size: 1000,
                originalname: "world.jpg",
                mimetype: "image/jpeg",
                imagetype: "jpeg",
                width: 800,
                height: 600
            };
            yield media.create(image);
            expect(yield media.load([image.id])).toMatchObject([
                {
                    id: "createImage.jpg",
                    size: 1000,
                    originalname: "world.jpg",
                    mimetype: "image/jpeg",
                    imagetype: "jpeg",
                    width: 800,
                    height: 600,
                    focusX: null,
                    focusY: null,
                    tags: null,
                    search: " world.jpg",
                    hash: null,
                    credit: null,
                    alt: null
                }
            ]);
        }));
        it("should update media", () => __awaiter(void 0, void 0, void 0, function* () {
            const image = {
                id: "updateMe.exe",
                size: 1000,
                originalname: "world.jpg",
                mimetype: "image/jpeg",
                imagetype: "jpeg",
                width: 800,
                height: 600
            };
            yield media.create(image);
            yield media.update(image.id, {
                focusX: 10,
                focusY: 10,
                tags: ["foo", "bar", "baz"],
                credit: "Mother of Dragons",
                alt: "Winter is coming",
                originalname: "foo.jpg"
            });
            expect(yield media.load([image.id])).toMatchObject([
                {
                    id: "updateMe.exe",
                    size: 1000,
                    originalname: "foo.jpg",
                    mimetype: "image/jpeg",
                    imagetype: "jpeg",
                    width: 800,
                    height: 600,
                    search: "foo bar baz foo.jpg",
                    hash: null,
                    focusX: 10,
                    focusY: 10,
                    tags: ["foo", "bar", "baz"],
                    credit: "Mother of Dragons",
                    alt: "Winter is coming"
                }
            ]);
        }));
        it("should list media", () => __awaiter(void 0, void 0, void 0, function* () {
            const list = yield media.list({});
            expect(list).toMatchObject({
                items: expect.arrayContaining([expect.objectContaining(image1)])
            });
        }));
        it("should find media", () => __awaiter(void 0, void 0, void 0, function* () {
            const list = yield media.list({ search: "hell" });
            expect(list).toMatchObject({
                total: 1,
                items: expect.arrayContaining([expect.objectContaining(image1)])
            });
        }));
        it("should not delete media in use", () => __awaiter(void 0, void 0, void 0, function* () {
            const id = (yield content.create({ title: "News", image: image1.id }, { title: "News", image: image1.id }, news, models.content, author));
            yield expect(media.delete(image1.id, models.content)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            yield content.setPublishedRev(news, id, 1, models.content);
            const data = {
                title: "News Rev 2",
                image: null
            };
            yield content.createRevision(data, data, news, models.content, id, author);
            yield expect(media.delete(image1.id, models.content)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            const data2 = { title: "News", image: image3.id };
            const id2 = (yield content.create(data2, data2, news, models.content, author));
            const data3 = {
                title: "News Rev 2",
                image: image3.id
            };
            yield content.createRevision(data3, data3, news, models.content, id2, author);
            yield content.setPublishedRev(news, id2, 2, models.content);
            const data4 = {
                title: "News Rev 3",
                image: image3.id
            };
            yield content.createRevision(data4, data4, news, models.content, id2, author);
            yield expect(media.delete(image3.id, models.content)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
        }));
        it("should delete previous but not anymore used media", () => __awaiter(void 0, void 0, void 0, function* () {
            const image = {
                id: "delete.jpg",
                size: 1000,
                originalname: "world.jpg",
                mimetype: "image/jpeg",
                imagetype: "jpeg",
                width: 800,
                height: 600
            };
            yield media.create(image);
            const id = (yield content.create({ title: "News", image: image.id }, { title: "News", image: image.id }, news, models.content, author));
            yield content.delete(news, id);
            yield media.delete(image.id, models.content);
        }));
        it("should delete media when model doesn't exist anymore", () => __awaiter(void 0, void 0, void 0, function* () {
            const image = {
                id: "deleteIfYouCan.jpg",
                size: 1000,
                originalname: "world.jpg",
                mimetype: "image/jpeg",
                imagetype: "jpeg",
                width: 800,
                height: 600
            };
            yield media.create(image);
            yield content.create({ title: "News", image: image.id }, { title: "News", image: image.id }, news, models.content, author);
            yield expect(media.delete(image.id, models.content)).rejects.toBeInstanceOf(ReferenceConflictError_1.default);
            const newModels = models.content.slice();
            newModels.shift();
            yield media.delete(image.id, newModels);
        }));
    });
});
//# sourceMappingURL=index.test.js.map