import path from "path";
import tempy from "tempy";
import fs from "fs-extra";
import { stringify } from "qs";
import request from "supertest";
import { init, Persistence, knexAdapter } from "../../..";
import models from "./models";
import { login } from "../../../__tests__/util";
import FsStorage from "../../../media/storage/FsStorage";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";

const uploadDir = path.join(__dirname, ".uploads");

describe("rest api", () => {
  let app: any;
  let persistence: Persistence;
  let server: request.SuperTest<request.Test>;
  let headers: object;
  let imageId: string;
  let productId: string;
  let newsId: string;
  const newsSlug = "foo-bar-baz";

  const create = async (type: string, data: object) => {
    const { body } = await server
      .post(`/admin/rest/content/${type}`)
      .set(headers)
      .send({ data })
      .expect(200);

    return body.id;
  };
  const update = async (type: string, id: string, data: object) => {
    const { body } = await server
      .put(`/admin/rest/content/${type}/${id}`)
      .set(headers)
      .send(data)
      .expect(200);

    return body;
  };

  beforeAll(async () => {
    const storage = new FsStorage(uploadDir);

    ({ app, persistence } = await init({
      models,
      thumbnailProvider: new LocalThumbnailProvider(storage),
      storage,
      persistenceAdapter: knexAdapter({
        client: "sqlite3",
        connection: {
          filename: tempy.file()
        },
        useNullAsDefault: true
      })
    }));

    ({ server, headers } = await login(
      request(app),
      "admin@cotype.dev",
      "admin"
    ));

    const imageBuffer = Buffer.from("Lorem Ipsum", "utf8");

    ({
      body: {
        files: [{ id: imageId }]
      }
    } = await server
      .post(`/admin/rest/upload`)
      .set(headers)
      .attach("file", imageBuffer, "lorem.test")
      .expect(200));

    productId = await create("products", {
      title: "product-title",
      ean: "fooBar"
    });

    newsId = await create("news", {
      slug: newsSlug,
      title: "initial-news",
      ref: { id: productId, model: "products" },
      image: imageId
    });

    await server
      .post(`/admin/rest/content/products/${productId}/publish`)
      .set(headers)
      .send({ rev: 1 })
      .expect(204);

    const res = await server
      .get(`/admin/rest/content/news/${newsId}/versions`)
      .set(headers);

    const [latest] = res.body;

    await server
      .post(`/admin/rest/content/news/${newsId}/publish`)
      .set(headers)
      .send({ rev: latest.rev })
      .expect(204);

    await update("news", newsId, {
      title: "updated-news",
      image: imageId,
      slug: newsSlug
    });
  });

  afterAll(async () => {
    await fs.remove(uploadDir);
    return persistence.shutdown();
  });

  describe("with content", () => {
    let expectedMedia: object;
    let expectedPublishedContent: object;
    let expectedDraftsContent: object;

    beforeAll(async () => {
      expectedMedia = {
        [imageId]: {
          created_at: expect.any(String),
          alt: null,
          credit: null,
          focusX: null,
          focusY: null,
          hash: expect.any(String),
          height: null,
          id: imageId,
          imagetype: null,
          mimetype: "application/octet-stream",
          originalname: "lorem.test",
          search: " lorem.test",
          size: 11,
          tags: null,
          width: null
        }
      };

      expectedPublishedContent = {
        image: {
          _id: imageId,
          _ref: "media",
          _src: `/media/${imageId}`
        },
        ref: {
          _content: "products",
          _id: productId,
          _ref: "content",
          _url: "path/to/product-title"
        },
        text: "",
        title: "initial-news",
        slug: newsSlug
      };

      expectedDraftsContent = {
        image: {
          _id: imageId,
          _ref: "media",
          _src: `/media/${imageId}`
        },
        text: "",
        title: "updated-news",
        slug: newsSlug
      };
    });

    const list = async (
      type: string,
      join: object = {},
      published: boolean = true
    ) => {
      const { body } = await server
        .get(
          `/rest/${published ? "published" : "drafts"}/${type}?${stringify(
            join
          )}`
        )
        .expect(200);

      return body;
    };
    const find = async (
      type: string,
      id: string,
      join: object = {},
      published: boolean = true
    ) => {
      const { body } = await server
        .get(
          `/rest/${
            published ? "published" : "drafts"
          }/${type}/${id}?${stringify(join)}`
        )
        .expect(200);

      return body;
    };

    const search = async (
      term: string,
      opts: {
        published?: boolean;
        linkableOnly?: boolean;
        includeModels?: string[];
        excludeModels?: string[];
        limit?: number;
        offset?: number;
      }
    ) => {
      const {
        published = true,
        linkableOnly = true,
        includeModels = [],
        excludeModels = [],
        limit = 50,
        offset = 0
      } = opts;
      const { body } = await server
        .get(
          `/rest/${
            published ? "published" : "drafts"
          }/search/content?${stringify({
            term,
            limit,
            offset,
            linkableOnly,
            includeModels,
            excludeModels
          })}`
        )
        .expect(200);

      return body;
    };

    const suggest = async (
      term: string,
      opts: {
        published?: boolean;
        linkableOnly?: boolean;
        includeModels?: string[];
        excludeModels?: string[];
      }
    ) => {
      const {
        published = true,
        linkableOnly = true,
        includeModels = [],
        excludeModels = []
      } = opts;
      const { body } = await server
        .get(
          `/rest/${
            published ? "published" : "drafts"
          }/search/suggest?${stringify({
            term,
            linkableOnly,
            includeModels,
            excludeModels
          })}`
        )
        .expect(200);

      return body;
    };

    const findByField = async (
      type: string,
      field: string,
      value: string,
      join: object = {},
      published: boolean = true
    ) => {
      const { body } = await server
        .get(
          `/rest/${
            published ? "published" : "drafts"
          }/${type}/${field}/${value}?${stringify(join)}`
        )
        .expect(200);

      return body;
    };

    describe("list contents", () => {
      it("should list news", async () => {
        const news = await list("news", {}, true);
        await expect(news.total).toBe(1);
      });

      it("should get published news by id", async () => {
        await expect(await find("news", newsId, {}, true)).toEqual({
          ...expectedPublishedContent,
          _id: newsId.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });
      });

      it("should get drafts news id", async () => {
        await expect(await find("news", newsId, {}, false)).toEqual({
          ...expectedDraftsContent,
          _id: newsId.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });
      });

      it("should get published news by unique field", async () => {
        await expect(
          await findByField("news", "slug", newsSlug, {}, true)
        ).toEqual({
          ...expectedPublishedContent,
          _id: newsId.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });

        await expect(
          await findByField("news", "title", "initial-news", {}, true)
        ).toEqual({
          ...expectedPublishedContent,
          _id: newsId.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });
      });

      it("should get published news by unique field", async () => {
        await expect(
          await findByField("news", "slug", newsSlug, {}, false)
        ).toEqual({
          ...expectedDraftsContent,
          _id: newsId.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });

        await expect(
          await findByField("news", "title", "updated-news", {}, false)
        ).toEqual({
          ...expectedDraftsContent,
          _id: newsId.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });
      });
    });

    describe("search contents", () => {
      const searchForAllContent = "Search Me";
      const searchForProduct = "Search Me Product";
      const searchForNews = "News Search Slug";
      const searchForArticleNews = "ArticleNews Search Slug";
      const description = "description-test";

      beforeAll(async () => {
        await create("products", {
          title: searchForProduct
        });

        await create("news", {
          slug: searchForNews,
          title: "Search Me News"
        });

        await create("articleNews", {
          slug: searchForArticleNews,
          title: "Search Me ArticleNews"
        });

        await create("news", {
          slug: "foo-bar",
          title: description,
          text: {
            ops: [{ insert: description }]
          }
        });

        await create("articleNews", {
          slug: "foo-bar",
          title: description,
          text: {
            ops: [{ insert: description }]
          }
        });
      });

      it("should find all content by search", async () => {
        const opts = {
          published: false,
          linkableOnly: false
        };
        expect((await search(searchForAllContent, opts)).total).toBe(3);
        expect((await search(searchForArticleNews, opts)).total).toBe(1);
        expect((await search(searchForNews, opts)).total).toBe(2);
        expect((await search(searchForProduct, opts)).total).toBe(1);
      });

      it("results should contain description", async () => {
        expect(
          (await search(description, {
            published: false,
            linkableOnly: false,
            includeModels: ["news"]
          })).items[0]
        ).toMatchObject({ description });
      });

      it("should find only linkable content by search", async () => {
        expect(
          (await search(searchForAllContent, {
            published: false,
            linkableOnly: true
          })).total
        ).toBe(2);
      });

      it("should find limited content by search", async () => {
        expect(
          (await search(searchForAllContent, {
            published: false,
            linkableOnly: true,
            includeModels: ["products"]
          })).total
        ).toBe(1);
        expect(
          (await search(searchForAllContent, {
            published: false,
            linkableOnly: true,
            includeModels: ["news"]
          })).total
        ).toBe(1);
        expect(
          (await search(searchForAllContent, {
            published: false,
            linkableOnly: true,
            excludeModels: ["news", "products"]
          })).total
        ).toBe(0);
        expect(
          (await search(searchForProduct, {
            published: false,
            linkableOnly: true,
            excludeModels: ["products"]
          })).total
        ).toBe(0);
        expect(
          (await search(searchForNews, {
            published: false,
            linkableOnly: true,
            includeModels: ["news"],
            excludeModels: ["products"]
          })).total
        ).toBe(1);
      });

      it("should limit and offset results", async () => {
        const res1 = await search(searchForAllContent, {
          published: false,
          linkableOnly: false,
          offset: 0,
          limit: 10
        });
        expect(res1.total).toBe(3);
        expect(res1.items.length).toBe(3);

        const res2 = await search(searchForAllContent, {
          published: false,
          linkableOnly: false,
          offset: 0,
          limit: 1
        });
        expect(res2.total).toBe(3);
        expect(res2.items.length).toBe(1);

        const res3 = await search(searchForAllContent, {
          published: false,
          linkableOnly: false,
          offset: 10,
          limit: 10
        });
        expect(res3.total).toBe(3);
        expect(res3.items.length).toBe(0);

        const res4 = await search(searchForAllContent, {
          published: false,
          linkableOnly: false,
          offset: 2,
          limit: 10
        });

        expect(res4.total).toBe(3);
        expect(res4.items.length).toBe(1);
      });

      it("shoud suggest terms", async () => {
        const res = await suggest("search", {
          published: false,
          includeModels: ["news"]
        });
        expect(res).toMatchObject(["Search Me", "Search Slug"]);
      });
    });
    describe("joins", () => {
      it("should include joined references", async () => {
        await expect(
          await list(
            "news",
            {
              join: { products: ["ean"] },
              ["data.title"]: { eq: "initial-news" }
            },
            true
          )
        ).toEqual({
          _refs: {
            content: {
              products: {
                [productId]: {
                  _id: productId,
                  _type: "products",
                  ean: "fooBar"
                }
              }
            },
            media: expectedMedia
          },
          items: [{ _id: newsId.toString(), ...expectedPublishedContent }],
          total: 1
        });
      });

      it("should not include not existing references", async () => {
        await expect(
          await list(
            "news",
            {
              join: { products: ["ean"] },
              ["data.title"]: { eq: "updated-news" }
            },
            false
          )
        ).toMatchObject({
          _refs: {
            content: {},
            media: expectedMedia
          },
          items: [
            { _id: newsId.toString().toString(), ...expectedDraftsContent }
          ],
          total: 1
        });
      });
    });
  });
});
