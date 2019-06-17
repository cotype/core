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
import faker from "faker";
import { Meta } from "../../../../typings";

const uploadDir = path.join(__dirname, ".uploads");

const buildProduct = () => ({
  title: faker.lorem.slug(4),
  ean: faker.lorem.words(),
  description: {
    ops: [{ insert: faker.lorem.paragraph(5) }]
  }
});

const buildNews = (
  p: { productId?: string; mediaId?: string },
  overrides?: object
) => ({
  title: faker.lorem.lines(1),
  slug: faker.lorem.slug(4),
  date: faker.date.recent,
  text: {
    ops: [{ insert: faker.lorem.paragraph(4) }]
  },
  ref: p.productId ? { id: p.productId, model: "products" } : undefined,
  image: p.mediaId,
  ...overrides
});

describe("rest api", () => {
  let app: any;
  let persistence: Persistence;
  let server: request.SuperTest<request.Test>;
  let headers: object;
  let mediaFile: Meta;
  let product: { id: string; data: ReturnType<typeof buildProduct> };
  let news: { id: string; data: ReturnType<typeof buildNews> };
  let updatedNews: { id: string; data: ReturnType<typeof buildNews> };

  const create = async (type: string, data: object) => {
    const { body } = await server
      .post(`/admin/rest/content/${type}`)
      .set(headers)
      .send({ data })
      .expect(200);

    return body;
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

    const mediaBuffer = Buffer.from(faker.lorem.paragraphs(), "utf8");

    ({
      body: {
        files: [mediaFile]
      }
    } = await server
      .post(`/admin/rest/upload`)
      .set(headers)
      .attach("file", mediaBuffer, faker.system.commonFileName("txt"))
      .expect(200));

    product = await create("products", buildProduct());

    news = await create(
      "news",
      buildNews({ productId: product.id, mediaId: mediaFile.id })
    );

    await server
      .post(`/admin/rest/content/products/${product.id}/publish`)
      .set(headers)
      .send({ rev: 1 })
      .expect(204);

    await server
      .post(`/admin/rest/content/news/${news.id}/publish`)
      .set(headers)
      .send({ rev: 1 })
      .expect(204);

    updatedNews = await update(
      "news",
      news.id,
      buildNews({ productId: product.id, mediaId: mediaFile.id })
    );
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
        [mediaFile.id]: {
          created_at: expect.any(String),
          alt: null,
          credit: null,
          focusX: null,
          focusY: null,
          height: null,
          search: ` ${mediaFile.originalname}`,
          tags: null,
          width: null,
          ...mediaFile
        }
      };

      expectedPublishedContent = {
        image: {
          _id: mediaFile.id,
          _ref: "media",
          _src: `/media/${mediaFile.id}`
        },
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
    });

    const list = async (
      type: string,
      params: object = {},
      published: boolean = true
    ) => {
      const { body } = await server
        .get(
          `/rest/${published ? "published" : "drafts"}/${type}?${stringify(
            params
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
        const newsList = await list("news", {}, true);
        await expect(newsList.total).toBe(1);
      });

      it("should list news with search criteria", async () => {
        await create("news", {
          slug: "lololorem-ipipipsum",
          title: "foo-new-title"
        });

        await expect(
          (await list(
            "news",
            { search: { term: "foo-new-t", scope: "title" } },
            false
          )).total
        ).toBe(1);

        await expect(
          (await list(
            "news",
            { search: { term: "lololor", scope: "global" } },
            false
          )).total
        ).toBe(1);
      });

      it("should not list news with wrong search criteria", async () => {
        await expect(
          (await list(
            "news",
            { search: { term: "lololor", scope: "title" } },
            false
          )).total
        ).toBe(0);

        await expect(
          (await list(
            "news",
            { search: { term: "foo-new-txx", scope: "title" } },
            false
          )).total
        ).toBe(0);

        await expect(
          (await list(
            "news",
            { search: { term: "lololor-xx", scope: "global" } },
            false
          )).total
        ).toBe(0);
      });

      it("should get published news by id", async () => {
        await expect(await find("news", news.id, {}, true)).toEqual({
          ...expectedPublishedContent,
          _id: news.id.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });
      });

      it("should get drafts news id", async () => {
        await expect(await find("news", news.id, {}, false)).toEqual({
          ...expectedDraftsContent,
          _id: news.id.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });
      });

      it("should get published news by unique field", async () => {
        await expect(
          await findByField("news", "slug", news.data.slug, {}, true)
        ).toEqual({
          ...expectedPublishedContent,
          _id: news.id.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });

        await expect(
          await findByField("news", "title", news.data.title, {}, true)
        ).toEqual({
          ...expectedPublishedContent,
          _id: news.id.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });
      });

      it("should get drafts news by unique field", async () => {
        await expect(
          await findByField("news", "slug", updatedNews.data.slug, {}, false)
        ).toEqual({
          ...expectedDraftsContent,
          _id: news.id.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });

        await expect(
          await findByField("news", "title", updatedNews.data.title, {}, false)
        ).toEqual({
          ...expectedDraftsContent,
          _id: news.id.toString(),
          _refs: {
            content: {},
            media: expectedMedia
          }
        });
      });
    });

    describe("search contents", () => {
      const searchForAllContent = faker.lorem.slug(5);
      const searchForProduct = faker.lorem.words(5);
      const searchForNews = faker.lorem.words(5);
      const searchForArticleNews = `${searchForNews} ${faker.lorem.word()}`;
      const description = faker.lorem.slug(5);

      beforeAll(async () => {
        await create("products", {
          title: searchForProduct,
          ean: `${searchForAllContent} ${faker.random.word()}`
        });

        await create("news", {
          slug: searchForNews,
          title: `${searchForAllContent} ${faker.hacker.adjective()}`
        });

        await create("articleNews", {
          slug: searchForArticleNews,
          title: `${searchForAllContent} ${faker.phone.phoneNumber()}`
        });

        await create(
          "news",
          buildNews(
            {},
            {
              text: {
                ops: [{ insert: description }]
              }
            }
          )
        );

        await create(
          "articleNews",
          buildNews(
            {},
            {
              text: {
                ops: [{ insert: description }]
              }
            }
          )
        );
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
        await expect(
          (await search(description, {
            published: false,
            linkableOnly: false,
            includeModels: ["news"]
          })).items[0]
        ).toMatchObject({ description });
      });

      it("should find only linkable content by search", async () => {
        await expect(
          (await search(searchForAllContent, {
            published: false,
            linkableOnly: true
          })).total
        ).toBe(2);
      });

      it("should find limited content by search", async () => {
        await expect(
          (await search(searchForAllContent, {
            published: false,
            linkableOnly: true,
            includeModels: ["products"]
          })).total
        ).toBe(1);
        await expect(
          (await search(searchForAllContent, {
            published: false,
            linkableOnly: true,
            includeModels: ["news"]
          })).total
        ).toBe(1);
        await expect(
          (await search(searchForAllContent, {
            published: false,
            linkableOnly: true,
            excludeModels: ["news", "products"]
          })).total
        ).toBe(0);
        await expect(
          (await search(searchForProduct, {
            published: false,
            linkableOnly: true,
            excludeModels: ["products"]
          })).total
        ).toBe(0);
        await expect(
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
        const res = await suggest(
          `${searchForNews
            .split(" ")
            .slice(0, 3)
            .join(" ")}`,
          {
            published: false,
            includeModels: ["news"]
          }
        );
        await expect(res).toMatchObject([
          searchForNews
            .split(" ")
            .slice(0, 4)
            .join(" ")
        ]);
      });
    });
    describe("joins", () => {
      it("should include joined references", async () => {
        await expect(
          await list(
            "news",
            {
              join: { products: ["ean"] },
              ["data.title"]: { eq: news.data.title }
            },
            true
          )
        ).toEqual({
          _refs: {
            content: {
              products: {
                [product.id]: {
                  _id: product.id,
                  _type: "products",
                  ean: product.data.ean
                }
              }
            },
            media: expectedMedia
          },
          items: [{ _id: news.id.toString(), ...expectedPublishedContent }],
          total: 1
        });
      });

      it("should only include existing references", async () => {
        await expect(
          await list(
            "news",
            {
              join: { products: ["ean"] },
              ["data.title"]: { eq: updatedNews.data.title }
            },
            false
          )
        ).toMatchObject({
          _refs: {
            content: {},
            media: expectedMedia
          },
          items: [
            { _id: news.id.toString().toString(), ...expectedDraftsContent }
          ],
          total: 1
        });
      });
    });
  });
});
