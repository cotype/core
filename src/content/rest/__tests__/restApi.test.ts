import path from "path";
import tempy from "tempy";
import fs from "fs-extra";
import { stringify } from "qs";
import request, { SuperTest, Test } from "supertest";
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
    let server: SuperTest<Test>;

    let expectedMedia: object;
    let expectedPublishedContent: object;
    let expectedDraftsContent: object;

    beforeAll(async () => {
      expectedMedia = {
        [imageId]: {
          created_at: expect.any(String),
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

      server = request(app);
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
      published: boolean = true,
      includeModels: string[] = [],
      excludeModels: string[] = []
    ) => {
      const { body } = await server
        .get(
          `/rest/${
            published ? "published" : "drafts"
          }/search/content?${stringify({ term, includeModels, excludeModels })}`
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
      it("create content for search", async () => {
        await create("products", {
          title: "Search Me Product"
        });

        await create("news", {
          slug: "News Search Slug",
          title: "Search Me News"
        });
      });

      it("should find content by search", async () => {
        expect((await search("Search Me", false)).total).toBe(2);
        expect((await search("News Search Slug", false)).total).toBe(1);
        expect((await search("Search Me Product", false)).total).toBe(1);
      });

      it("should find limited content by search", async () => {
        expect((await search("Search Me", false, ["products"])).total).toBe(1);
        expect((await search("Search Me", false, ["news"])).total).toBe(1);
        expect(
          (await search("Search Me", false, [], ["products", "news"])).total
        ).toBe(0);
        expect(
          (await search("Search Me Product", false, [], ["products"])).total
        ).toBe(0);
        expect(
          (await search("News Search Slug", false, ["news"], ["products"]))
            .total
        ).toBe(1);
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
