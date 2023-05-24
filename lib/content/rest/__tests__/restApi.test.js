"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const tempy_1 = __importDefault(require("tempy"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const supertest_1 = __importDefault(require("supertest"));
const __1 = require("../../..");
const models_1 = __importDefault(require("./models"));
const util_1 = require("../../../__tests__/util");
const FsStorage_1 = __importDefault(require("../../../media/storage/FsStorage"));
const local_thumbnail_provider_1 = __importDefault(require("@cotype/local-thumbnail-provider"));
const faker_1 = __importDefault(require("faker"));
const apiHelper_1 = require("./apiHelper");
const uploadDir = path_1.default.join(__dirname, ".uploads");
const buildProduct = (p) => ({
    title: faker_1.default.lorem.slug(4),
    ean: faker_1.default.lorem.words(),
    description: {
        ops: [{ insert: faker_1.default.lorem.paragraph(5) }]
    },
    ref: p.articleNewsId
        ? { id: p.articleNewsId, model: "articleNews" }
        : undefined
});
const buildNews = (p, overrides) => ({
    title: faker_1.default.lorem.lines(1),
    slug: faker_1.default.lorem.slug(4),
    date: faker_1.default.date.recent,
    text: {
        ops: [{ insert: faker_1.default.lorem.paragraph(4) }]
    },
    ref: p.productId ? { id: p.productId, model: "products" } : undefined,
    image: p.mediaId,
    ...overrides
});
describe("rest api", () => {
    let app;
    let persistence;
    let server;
    let headers;
    let mediaFile;
    let product;
    let news;
    let articleNews;
    let updatedNews;
    let find;
    let list;
    let search;
    let findByField;
    let suggest;
    let create;
    let update;
    beforeAll(async () => {
        const storage = new FsStorage_1.default(uploadDir);
        ({ app, persistence } = await (0, __1.init)({
            models: models_1.default,
            thumbnailProvider: new local_thumbnail_provider_1.default(storage),
            storage,
            persistenceAdapter: (0, __1.knexAdapter)({
                client: "sqlite3",
                connection: {
                    filename: tempy_1.default.file()
                },
                useNullAsDefault: true
            })
        }));
        ({ server, headers } = await (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin"));
        ({ find, list, search, findByField, suggest } =
            (0, apiHelper_1.createApiReadHelpers)(server));
        ({ create, update } = (0, apiHelper_1.createApiWriteHelpers)(server, headers));
        const mediaBuffer = Buffer.from(faker_1.default.lorem.paragraphs(), "utf8");
        ({
            body: {
                files: [mediaFile]
            }
        } = await server
            .post(`/admin/rest/upload`)
            .set(headers)
            .attach("file", mediaBuffer, faker_1.default.system.commonFileName("txt"))
            .expect(200));
        articleNews = await create("articleNews", buildNews({}));
        product = await create("products", buildProduct({ articleNewsId: articleNews.id }));
        news = await create("news", buildNews({ productId: product.id, mediaId: mediaFile.id }));
        const publish = async (type, id) => server
            .post(`/admin/rest/content/${type}/${id}/publish`)
            .set(headers)
            .send({ rev: 1 })
            .expect(204);
        await publish("articleNews", articleNews.id);
        await publish("products", product.id);
        await publish("news", news.id);
        updatedNews = await update("news", news.id, buildNews({ mediaId: mediaFile.id }));
    });
    afterAll(async () => {
        await fs_extra_1.default.remove(uploadDir);
        return persistence.shutdown();
    });
    describe("with content", () => {
        let mediaRefs;
        let contentRefs;
        let expectedPublishedContent;
        let expectedDraftsContent;
        beforeAll(async () => {
            mediaRefs = {
                [mediaFile.id]: {
                    created_at: expect.any(String),
                    alt: null,
                    credit: null,
                    focusX: null,
                    focusY: null,
                    // height: null,
                    search: ` ${mediaFile.originalname}`,
                    tags: null,
                    // width: null,
                    ...mediaFile
                }
            };
            contentRefs = {
                products: {
                    [product.id]: {
                        _id: product.id,
                        _type: "products",
                        ean: product.data.ean
                    }
                }
            };
            expectedPublishedContent = {
                image: {
                    _id: mediaFile.id,
                    _ref: "media",
                    _src: `/media/${mediaFile.id}`
                },
                imageList: [],
                ref: {
                    _content: "products",
                    _id: product.id,
                    _ref: "content",
                    _url: `path/to/${product.data.title}`
                },
                text: `<p>${news.data.text.ops[0].insert}</p>`,
                title: news.data.title,
                slug: news.data.slug
            };
            expectedDraftsContent = {
                ...expectedPublishedContent,
                text: `<p>${updatedNews.data.text.ops[0].insert}</p>`,
                title: updatedNews.data.title,
                slug: updatedNews.data.slug
            };
            delete expectedDraftsContent.ref;
        });
        describe("list contents", () => {
            it("should list news", async () => {
                const newsList = await list("news", {}, true);
                await expect(newsList.total).toBe(1);
            });
            it("should list news with search criteria", async () => {
                await create("news", {
                    slug: "lololorem-ipipipsum",
                    title: "foo-new-title"
                });
                await expect((await list("news", { search: { term: "foo-new-t", scope: "title" } }, false)).total).toBe(1);
                await expect((await list("news", { search: { term: "lololor", scope: "global" } }, false)).total).toBe(1);
            });
            it("should not list news with wrong search criteria", async () => {
                await expect((await list("news", { search: { term: "lololor", scope: "title" } }, false)).total).toBe(0);
                await expect((await list("news", { search: { term: "foo-new-txx", scope: "title" } }, false)).total).toBe(0);
                await expect((await list("news", { search: { term: "lololor-xx", scope: "global" } }, false)).total).toBe(0);
            });
            it("should get published news by id", async () => {
                await expect(await find("news", news.id, {}, true)).toStrictEqual({
                    ...expectedPublishedContent,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
            });
            it("should get drafts news id", async () => {
                await expect(await find("news", news.id, {}, false)).toStrictEqual({
                    ...expectedDraftsContent,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
            });
            it("should get published news by unique field", async () => {
                await expect(await findByField("news", "slug", news.data.slug, {}, true)).toStrictEqual({
                    ...expectedPublishedContent,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
                await expect(await findByField("news", "title", news.data.title, {}, true)).toStrictEqual({
                    ...expectedPublishedContent,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
            });
            it("should get drafts news by unique field", async () => {
                await expect(await findByField("news", "slug", updatedNews.data.slug, {}, false)).toStrictEqual({
                    ...expectedDraftsContent,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
                await expect(await findByField("news", "title", updatedNews.data.title, {}, false)).toStrictEqual({
                    ...expectedDraftsContent,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
            });
        });
        describe("select fields", () => {
            it("should only return selected fields when loading content", async () => {
                await expect(await find("news", news.id, { fields: ["title"] }, true)).toStrictEqual({
                    title: expectedPublishedContent.title,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: {}
                    }
                });
                await expect(await find("news", news.id, { fields: ["title", "image"] }, true)).toStrictEqual({
                    title: expectedPublishedContent.title,
                    image: expectedPublishedContent.image,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
                await expect(await find("news", news.id, { fields: ["title", "image", "ref"], join: { products: ["ean"] } }, true)).toStrictEqual({
                    title: expectedPublishedContent.title,
                    image: expectedPublishedContent.image,
                    ref: expectedPublishedContent.ref,
                    _id: news.id.toString(),
                    _refs: {
                        content: contentRefs,
                        media: mediaRefs
                    }
                });
            });
            it("should only return selected fields when listing content", async () => {
                await expect(await list("news", { fields: ["title"] }, true)).toStrictEqual({
                    total: 1,
                    items: [
                        { title: expectedPublishedContent.title, _id: news.id.toString() }
                    ],
                    _refs: {
                        content: {},
                        media: {}
                    }
                });
                await expect(await list("news", { fields: ["title"], slug: { eq: news.data.slug } }, true)).toStrictEqual({
                    total: 1,
                    items: [
                        { title: expectedPublishedContent.title, _id: news.id.toString() }
                    ],
                    _refs: {
                        content: {},
                        media: {}
                    }
                });
                await expect(await list("news", { fields: ["title", "image"] }, true)).toStrictEqual({
                    total: 1,
                    items: [
                        {
                            title: expectedPublishedContent.title,
                            image: expectedPublishedContent.image,
                            _id: news.id.toString()
                        }
                    ],
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
                await expect(await list("news", { fields: ["title", "image", "ref"], join: { products: ["ean"] } }, true)).toStrictEqual({
                    total: 1,
                    items: [
                        {
                            title: expectedPublishedContent.title,
                            image: expectedPublishedContent.image,
                            ref: expectedPublishedContent.ref,
                            _id: news.id.toString()
                        }
                    ],
                    _refs: {
                        content: contentRefs,
                        media: mediaRefs
                    }
                });
                await expect(await list("news", { fields: ["title", "image"] }, true)).toStrictEqual({
                    total: 1,
                    items: [
                        {
                            title: expectedPublishedContent.title,
                            image: expectedPublishedContent.image,
                            _id: news.id.toString()
                        }
                    ],
                    _refs: {
                        content: {},
                        media: mediaRefs
                    }
                });
            });
            it("should only return selected fields when finding content by field", async () => {
                await expect(await findByField("news", "slug", news.data.slug, { fields: ["title"] }, true)).toStrictEqual({
                    title: expectedPublishedContent.title,
                    _id: news.id.toString(),
                    _refs: {
                        content: {},
                        media: {}
                    }
                });
            });
        });
        describe("search contents", () => {
            const searchForAllContent = faker_1.default.lorem.slug(5);
            const searchForProduct = faker_1.default.lorem.words(5);
            const searchForNews = faker_1.default.lorem.words(5);
            const searchForArticleNews = `${searchForNews} ${faker_1.default.lorem.slug(2)}`;
            const description = faker_1.default.lorem.slug(5);
            beforeAll(async () => {
                await create("products", {
                    title: searchForProduct,
                    ean: `${searchForAllContent} ${faker_1.default.random.word()}`
                });
                await create("news", {
                    slug: searchForNews,
                    title: `${searchForAllContent} ${faker_1.default.hacker.adjective()}`
                });
                await create("articleNews", {
                    slug: searchForArticleNews,
                    title: `${searchForAllContent} ${faker_1.default.phone.phoneNumber()}`
                });
                await create("news", buildNews({}, {
                    text: {
                        ops: [{ insert: description }]
                    }
                }));
                await create("articleNews", buildNews({}, {
                    text: {
                        ops: [{ insert: description }]
                    }
                }));
            });
            it("should find all content by search", async () => {
                const opts = {
                    published: false,
                    linkableOnly: false
                };
                await expect((await search(searchForAllContent, opts)).total).toBe(3);
                await expect((await search(searchForArticleNews, opts)).total).toBe(1);
                await expect((await search(searchForNews, opts)).total).toBe(2);
                await expect((await search(searchForProduct, opts)).total).toBe(1);
            });
            it("results should contain description", async () => {
                await expect((await search(description, {
                    published: false,
                    linkableOnly: false,
                    includeModels: ["news"]
                })).items[0]).toMatchObject({ description });
            });
            it("should find only linkable content by search", async () => {
                await expect((await search(searchForAllContent, {
                    published: false,
                    linkableOnly: true
                })).total).toBe(2);
            });
            it("should find limited content by search", async () => {
                await expect((await search(searchForAllContent, {
                    published: false,
                    linkableOnly: true,
                    includeModels: ["products"]
                })).total).toBe(1);
                await expect((await search(searchForAllContent, {
                    published: false,
                    linkableOnly: true,
                    includeModels: ["news"]
                })).total).toBe(1);
                await expect((await search(searchForAllContent, {
                    published: false,
                    linkableOnly: true,
                    excludeModels: ["news", "products"]
                })).total).toBe(0);
                await expect((await search(searchForProduct, {
                    published: false,
                    linkableOnly: true,
                    excludeModels: ["products"]
                })).total).toBe(0);
                await expect((await search(searchForNews, {
                    published: false,
                    linkableOnly: true,
                    includeModels: ["news"],
                    excludeModels: ["products"]
                })).total).toBe(1);
            });
            it("should limit and offset results", async () => {
                const res1 = await search(searchForAllContent, {
                    published: false,
                    linkableOnly: false,
                    offset: 0,
                    limit: 10
                });
                await expect(res1.total).toBe(3);
                await expect(res1.items.length).toBe(3);
                const res2 = await search(searchForAllContent, {
                    published: false,
                    linkableOnly: false,
                    offset: 0,
                    limit: 1
                });
                await expect(res2.total).toBe(3);
                await expect(res2.items.length).toBe(1);
                const res3 = await search(searchForAllContent, {
                    published: false,
                    linkableOnly: false,
                    offset: 10,
                    limit: 10
                });
                await expect(res3.total).toBe(3);
                await expect(res3.items.length).toBe(0);
                const res4 = await search(searchForAllContent, {
                    published: false,
                    linkableOnly: false,
                    offset: 2,
                    limit: 10
                });
                await expect(res4.total).toBe(3);
                await expect(res4.items.length).toBe(1);
            });
            it("shoud suggest terms", async () => {
                const res = await suggest(`${searchForNews
                    .split(" ")
                    .slice(0, 2)
                    .map((el, i) => (i === 0 ? el : el.slice(0, 4)))
                    .join(" ")}`, {
                    published: false,
                    includeModels: ["news"]
                });
                await expect(res).toMatchObject([
                    searchForNews.split(" ").slice(0, 2).join(" ")
                ]);
            });
        });
        describe("joins", () => {
            it("should include joined references", async () => {
                await expect(await list("news", {
                    join: { products: ["ean"] },
                    ["data.title"]: { eq: news.data.title }
                }, true)).toStrictEqual({
                    _refs: {
                        content: contentRefs,
                        media: mediaRefs
                    },
                    items: [{ _id: news.id.toString(), ...expectedPublishedContent }],
                    total: 1
                });
            });
            it("should include deep joined references", async () => {
                await expect(await list("news", {
                    join: { products: ["ean", "ref.title"] },
                    ["data.title"]: { eq: news.data.title }
                }, true)).toStrictEqual({
                    _refs: {
                        content: {
                            products: {
                                [product.id]: {
                                    _id: product.id,
                                    _type: "products",
                                    ean: product.data.ean,
                                    ref: {
                                        _content: "articleNews",
                                        _id: articleNews.id,
                                        _ref: "content"
                                    }
                                }
                            },
                            articleNews: {
                                [articleNews.id]: {
                                    _id: articleNews.id,
                                    _type: "articleNews",
                                    title: articleNews.data.title
                                }
                            }
                        },
                        media: mediaRefs
                    },
                    items: [
                        {
                            _id: news.id.toString(),
                            ...expectedPublishedContent
                        }
                    ],
                    total: 1
                });
            });
            it("should only include existing references", async () => {
                await expect(await list("news", {
                    join: { products: ["ean"] },
                    ["data.title"]: { eq: updatedNews.data.title }
                }, false)).toStrictEqual({
                    _refs: {
                        content: {},
                        media: mediaRefs
                    },
                    items: [{ _id: news.id.toString(), ...expectedDraftsContent }],
                    total: 1
                });
            });
        });
    });
});
//# sourceMappingURL=restApi.test.js.map