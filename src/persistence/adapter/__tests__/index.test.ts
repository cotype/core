import { Model, PreviewOpts, Media } from "../../../../typings";
import tempy from "tempy";
import {
  PersistenceAdapter,
  SettingsAdapter,
  ContentAdapter,
  MediaAdapter
} from "../";
import knex from "../knex";
import contentModels from "./models";
import buildModels from "../../../model";
import ReferenceConflictError from "../../errors/ReferenceConflictError";
import UniqueFieldError from "../../errors/UniqueFieldError";

const models = buildModels(contentModels);

const roles: Model = models.settings.find(m => m.name === "roles")!;
const users: Model = models.settings.find(m => m.name === "users")!;
const news = models.content[0];
const pages = models.content[1];
const uniqueContent = models.content[2];
const indexContent = models.content[3];

const implementations = [
  [
    "knex",
    knex({
      client: "sqlite3",
      connection: {
        filename: tempy.file()
      },
      useNullAsDefault: true
    })
  ]
];

if (process.env.DB) {
  implementations.push([
    "mysql",
    knex({
      client: "mysql",
      connection: process.env.DB
    })
  ]);
}

describe.each(implementations)("%s adapter", (_, impl) => {
  let adapter: PersistenceAdapter;
  let settings: SettingsAdapter;
  let content: ContentAdapter;
  let media: MediaAdapter;

  const permissions = {
    settings: true,
    content: {
      "*": 7
    }
  };

  const createRole = (name: string) =>
    settings.create(roles, {
      name,
      permissions
    });

  beforeAll(async () => {
    adapter = (await impl) as PersistenceAdapter;
    settings = adapter.settings;
    content = adapter.content;
    media = adapter.media;
  });

  afterAll(() => adapter.shutdown());

  describe("settings", () => {
    it("should create roles", async () => {
      const id = await createRole("create-role-test");
      expect(id).toBeGreaterThan(0);
    });

    it("should list roles", async () => {
      const name = "list-role-test";
      const id = await createRole(name);
      const res = await settings.list(roles, {});
      await expect(res).toMatchObject({
        items: expect.arrayContaining([expect.objectContaining({ id, name })])
      });
    });

    it("should load roles", async () => {
      const name = "load-role-test";
      const id = await createRole(name);
      const res = await settings.load(roles, id);
      await expect(res).toMatchObject({ id, name });
    });

    it("should find roles", async () => {
      const name = "find-role-test";
      const id = await createRole(name);
      const res = await settings.find(roles, "name", name);
      await expect(res).toMatchObject({ id, name });
    });

    it("should delete roles", async () => {
      const name = "find-role-test";
      const id = await createRole(name);
      const res = await settings.delete(roles, id);
      await expect(res).toEqual(1);
    });

    it("should not delete roles", async () => {
      const name = "find-role-test";
      const role = await createRole(name);

      await settings.create(users, {
        role,
        name: "not-delectable",
        email: "role-should-not-be-delectable@example.com",
        password: "xxx"
      });

      await expect(settings.delete(roles, role)).rejects.toBeInstanceOf(Error);
    });

    it("should create users", async () => {
      const role = await createRole("create-user-test");
      const id = await settings.create(users, {
        role,
        name: "create-test",
        email: "create-test@example.com",
        password: "xxx"
      });
      await expect(id).toBeGreaterThan(0);
    });

    it("should delete users", async () => {
      const role = await createRole("delete-user-test");
      const id = await settings.create(users, {
        role,
        name: "delete-test",
        email: "delete-test@example.com",
        password: "xxx"
      });

      const data = { title: "News" };
      // create content with user for a foreign key constraint
      await content.create(data, data, news, models.content, id);

      await settings.deleteUser(id);
      const userList = await settings.list(users, {});

      await expect(userList.items).not.toContainEqual(
        expect.objectContaining({ id })
      );
      await expect(await settings.loadUser(id)).toBeNull();
    });

    it("should load user with permissions", async () => {
      const role = await createRole("load-user-test");
      const id = await settings.create(users, {
        role,
        name: "load-test",
        email: "load-test@example.com",
        password: "xxx"
      });
      const user = await settings.loadUser(id);
      await expect(user).toMatchObject({
        name: "load-test",
        role,
        permissions
      });
    });
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
    let author: string;

    const createNews = (...data: object[]) => {
      return Promise.all(
        data.map(
          d =>
            content.create(
              { ...sampleNews, ...d },
              { ...sampleNews, ...d },
              news,
              models.content,
              author
            ) as Promise<string>
        )
      );
    };

    const samplePage = {
      title: "Sample page"
    };

    const createPages = (...data: object[]) => {
      return Promise.all(
        data.map(
          d =>
            content.create(
              { ...samplePage, ...d },
              { ...samplePage, ...d },
              pages,
              models.content,
              author
            ) as Promise<string>
        )
      );
    };

    const createIndexContent = (...data: object[]) => {
      return Promise.all(
        data.map(
          d =>
            content.create(
              { ...d },
              { ...d },
              indexContent,
              models.content,
              author
            ) as Promise<string>
        )
      );
    };

    beforeAll(async () => {
      const role = await createRole("author");
      author = await settings.create(users, {
        role,
        name: "Test Author",
        email: "author@example.com",
        password: "xxx"
      });
    });

    it("should create content", async () => {
      const [id] = await createNews({});
      await expect(id).toBeGreaterThan(0);
    });

    it("should create a revision", async () => {
      const [id] = await createNews({});
      const data = {
        ...sampleNews,
        title: "Updated"
      };
      const rev = await content.createRevision(
        data,
        data,
        news,
        models.content,
        id,
        author
      );
      await expect(rev).toBeGreaterThan(0);
    });

    it("should load content", async () => {
      const [id] = await createNews({});
      const cnt = await content.load(news, id);
      await expect(cnt).toMatchObject({
        id,
        type: "news",
        data: sampleNews
      });
    });

    it("should load revisions", async () => {
      const [id] = await createNews({});
      const rev = await content.loadRevision(news, id, 1);
      await expect(rev).toMatchObject({
        id,
        rev: 1,
        data: sampleNews
      });
    });

    it("should list versions", async () => {
      const [id] = await createNews({});
      const data = {
        ...sampleNews,
        title: "Updated"
      };
      await content.createRevision(
        data,
        data,
        news,
        models.content,
        id,
        author
      );
      const revs = await content.listVersions(news, id);
      await expect(revs).toMatchObject([
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
    });

    describe("publish", () => {
      it("should succeed", async () => {
        const [newsId] = await createNews({});

        await content.setPublishedRev(
          news,
          newsId as string,
          1,
          models.content
        );
        const [latest] = await content.listVersions(news, newsId);
        await expect(latest.published).toBe(true);
      });

      it("should fail if referencing unpublished content", async () => {
        const [newsId] = await createNews({});
        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });

        await expect(
          content.setPublishedRev(pages, pageId, 1, models.content)
        ).rejects.toBeInstanceOf(ReferenceConflictError);
      });

      it("should succeed if referencing published content", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);

        const [latest] = await content.listVersions(pages, pageId);
        await expect(latest.published).toBe(true);
      });

      it("should fail if referencing scheduled content that is still invisible", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);
        await content.schedule(news, newsId, {
          visibleFrom: new Date(Date.now() + 600000)
        });

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });

        await expect(
          content.setPublishedRev(pages, pageId, 1, models.content)
        ).rejects.toBeInstanceOf(ReferenceConflictError);
      });

      it("should fail if referencing content that will become invisible", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);
        await content.schedule(news, newsId, {
          visibleUntil: new Date(Date.now() + 600000)
        });

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });

        await expect(
          content.setPublishedRev(pages, pageId, 1, models.content)
        ).rejects.toBeInstanceOf(ReferenceConflictError);
      });

      it("should succeed if reference is optional", async () => {
        const [newsId] = await createNews({});
        const [pageId] = await createPages({
          optionalNews: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);
      });
    });

    describe("unpublish", () => {
      it("should fail if referenced by published content", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);

        await expect(
          content.setPublishedRev(news, newsId, null, models.content)
        ).rejects.toBeInstanceOf(ReferenceConflictError);
      });

      it("should succeed if referrer is unpublished first", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);
        await content.setPublishedRev(pages, pageId, null, models.content);
        await content.setPublishedRev(news, newsId, null, models.content);
      });

      it("should succeed if referrer is deleted first", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);
        await content.delete(pages, pageId);
        await content.setPublishedRev(news, newsId, null, models.content);
      });

      it("should succeed if reference is optional", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          optionalNews: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);
        await content.setPublishedRev(news, newsId, null, models.content);
      });
    });

    describe("delete", () => {
      it("should fail if referenced by published content", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);

        await expect(content.delete(news, newsId)).rejects.toBeInstanceOf(
          ReferenceConflictError
        );
      });

      it("should succeed if referenced by unpublished content", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);

        await expect(content.delete(news, newsId)).rejects.toBeInstanceOf(
          ReferenceConflictError
        );

        await content.setPublishedRev(pages, pageId, null, models.content);
        await content.delete(news, newsId);
      });

      it("should succeed if referenced by published but expired content", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);
        await content.schedule(pages, pageId, {
          visibleUntil: new Date(Date.now() - 1000)
        });
        await content.delete(news, newsId);
      });
    });

    describe("schedule", () => {
      it("should succeed if visible after refs", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);
        await content.schedule(news, newsId, {
          visibleFrom: new Date(Date.now() + 300000)
        });

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });

        await content.schedule(pages, pageId, {
          visibleFrom: new Date(Date.now() + 600000)
        });
      });

      it("should fail if visible before refs", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);
        await content.schedule(news, newsId, {
          visibleFrom: new Date(Date.now() + 600000)
        });

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });

        await expect(
          content.schedule(pages, pageId, {
            visibleFrom: new Date(Date.now() + 300000)
          })
        ).rejects.toBeInstanceOf(ReferenceConflictError);
      });

      it("should succeed if expires before refs", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);
        await content.schedule(news, newsId, {
          visibleUntil: new Date(Date.now() + 600000)
        });

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });

        await content.schedule(pages, pageId, {
          visibleUntil: new Date(Date.now() + 300000)
        });
      });

      it("should fail if expires after refs", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);
        await content.schedule(news, newsId, {
          visibleUntil: new Date(Date.now() + 300000)
        });

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });

        await expect(
          content.schedule(pages, pageId, {
            visibleUntil: new Date(Date.now() + 600000)
          })
        ).rejects.toBeInstanceOf(ReferenceConflictError);
      });

      it("should fail if content expires before a referring content", async () => {
        const [newsId] = await createNews({});
        await content.setPublishedRev(news, newsId, 1, models.content);

        const [pageId] = await createPages({
          news: { id: newsId, model: "news" }
        });
        await content.setPublishedRev(pages, pageId, 1, models.content);
        await expect(
          content.schedule(news, newsId, {
            visibleUntil: new Date(Date.now() + 300000)
          })
        ).rejects.toBeInstanceOf(ReferenceConflictError);
      });
    });

    describe("list", () => {
      let ids: string[];
      let indexContentIds: string[] = [];

      beforeAll(async () => {
        ids = await createNews({}, { title: "Test2" }, {});

        indexContentIds = await createIndexContent(
          { name: "CCC", slug: "AAA", test: "AAA" },
          { name: "AAA", slug: "CCC", test: "CCC" },
          { name: "BBB", slug: "BBB", test: "BBB" }
        );
      });

      it("should list content", async () => {
        const cnt = await content.list(news, models.content);
        await expect(cnt.total).toBeGreaterThan(2);
        await expect(cnt).toMatchObject({
          items: expect.arrayContaining([
            expect.objectContaining({ id: ids[0], data: sampleNews }),
            expect.objectContaining({ id: ids[1] }),
            expect.objectContaining({ id: ids[2], data: sampleNews })
          ])
        });
      });

      it("should list content ordered by title", async () => {
        await createNews(
          { title: "abc", date: "2050-01-01" },
          { title: "bcd", date: "2050-01-01" },
          { title: "ABC", date: "2050-01-01" },
          { title: "BCD", date: "2050-01-01" }
        );

        const find = (order: string) =>
          content.list(
            news,
            models.content,
            { order, orderBy: "title" },
            {
              "data.date": { eq: "2050-01-01" }
            }
          );

        const listAsc = await find("asc");
        const ascTitles = listAsc.items.map(i => i.data.title);

        await expect(ascTitles).toEqual(["abc", "ABC", "bcd", "BCD"]);

        const listDesc = await find("desc");
        const descTitles = listDesc.items.map(i => i.data.title);

        await expect(descTitles).toEqual(["bcd", "BCD", "abc", "ABC"]);
      });

      it("auto indexed field (title) should be name", async () => {
        expect(indexContent.title).toBe("name");
      });

      it("could be sort by auto indexed field (title)", async () => {
        const find = (order: string) =>
          content.list(indexContent, models.content, {
            order,
            orderBy: indexContent.title
          });

        const listAsc = await find("asc");
        const ascTitles = listAsc.items.map(i => i.data.name);

        await expect(ascTitles).toEqual(["AAA", "BBB", "CCC"]);

        const listDesc = await find("desc");
        const descTitles = listDesc.items.map(i => i.data.name);

        await expect(descTitles).toEqual(["CCC", "BBB", "AAA"]);
      });

      it("could be sort by auto indexed field (uniqueField)", async () => {
        const find = (order: string) =>
          content.list(indexContent, models.content, {
            order,
            orderBy: indexContent.uniqueFields
              ? indexContent.uniqueFields[0]
              : ""
          });

        const listAsc = await find("asc");
        const ascTitles = listAsc.items.map(i => i.data.slug);

        await expect(ascTitles).toEqual(["AAA", "BBB", "CCC"]);

        const listDesc = await find("desc");
        const descTitles = listDesc.items.map(i => i.data.slug);

        await expect(descTitles).toEqual(["CCC", "BBB", "AAA"]);
      });

      it("could not be sort by not indexed field instead sort id", async () => {
        const find = (order: string) =>
          content.list(indexContent, models.content, {
            order,
            orderBy: "test"
          });

        const listAsc = await find("asc");
        const ascTitles = listAsc.items.map(i => i.id);

        await expect(ascTitles).toEqual(indexContentIds);

        const listDesc = await find("desc");
        const descTitles = listDesc.items.map(i => i.id);

        await expect(descTitles).toEqual(indexContentIds.reverse());
      });

      it("should list content ordered by id", async () => {
        const find = (order: string) =>
          content.list(
            news,
            models.content,
            { order },
            {
              "data.date": { eq: "2050-01-01" }
            }
          );

        const listAsc = await find("asc");
        const idsAsc = listAsc.items.map(i => Number(i.id));

        await expect(idsAsc).toEqual(idsAsc.sort((a, b) => a - b));

        const listDesc = await find("desc");
        const idsDesc = listDesc.items.map(i => Number(i.id));

        await expect(idsDesc).toEqual(idsAsc.sort((a, b) => b - a));
      });

      it("should list content by searchTerm", async () => {
        const createdNewsIds = await createNews(
          { title: "yaddi bar" },
          { title: "YADDI bazinga" }
        );

        const list = await content.list(news, models.content, {
          search: { term: "yad" }
        });

        await expect(list.items).toHaveLength(2);
        await expect(list.total).toBe(2);
        await expect(list.items.map(i => i.id).sort()).toMatchObject(
          createdNewsIds.sort()
        );

        const list2 = await content.list(news, models.content, {
          search: { term: "DDI" }
        });

        await expect(list2.items).toHaveLength(2);
        await expect(list2.total).toBe(2);
        await expect(list2.items.map(i => i.id).sort()).toMatchObject(
          createdNewsIds.sort()
        );

        const list3 = await content.list(news, models.content, {
          search: { term: "bazing" }
        });
        await expect(list3.items).toHaveLength(1);
        await expect(list3.total).toBe(1);
        await expect(list3.items[0].data.title).toBe("YADDI bazinga");
      });

      it("should support paging", async () => {
        const cnt = await content.list(news, models.content);
        const i = cnt.items.findIndex(i2 => i2.id === ids[0]);
        const page = await content.list(news, models.content, {
          offset: i,
          limit: 2
        });
        await expect(page).toMatchObject({
          total: cnt.total,
          items: cnt.items.slice(i, i + 2)
        });
      });

      it("should not list deleted content", async () => {
        const list = await content.list(news, models.content);
        const first = list.items[0].id;
        await content.delete(news, first);
        const altered = await content.list(news, models.content);
        const e: any = expect;
        await expect(altered).toMatchObject({
          total: list.total - 1,
          items: e.not.arrayContaining([{ id: first }])
        });
      });

      it("should find content references", async () => {
        const [newsId] = await createNews({});
        const [pageId] = await createPages({
          optionalNews: { id: newsId, model: "news" }
        });

        await expect(
          await content.loadContentReferences([pageId], pages, models.content)
        ).toMatchObject([expect.any(Object), expect.any(Object)]);
      });

      it("should not find deleted content references", async () => {
        const [newsId] = await createNews({});
        const [pageId] = await createPages({
          optionalNews: { id: newsId, model: "news" }
        });
        await content.delete(news, newsId);

        await expect(
          await content.loadContentReferences([pageId], pages, models.content)
        ).toMatchObject([expect.any(Object)]);
      });

      it("should contain inverseReferences", async () => {
        const [newsId] = await createNews({ date: "2020-01-01" });
        const [pageId] = await createPages({
          optionalNews: { id: newsId, model: "news" }
        });
        const c = await content.load(news, newsId, { publishedOnly: false });
        await expect(c).toMatchObject({
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
      });
      it("should contain inverseReferences find", async () => {
        const [newsId] = await createNews({ date: "2020-01-02" });
        const [pageId] = await createPages({
          optionalNews: { id: newsId, model: "news" }
        });
        const c = await content.list(
          news,
          models.content,
          {},
          {
            "data.date": {
              eq: "2020-01-02"
            }
          },
          { publishedOnly: false }
        );
        await expect(c.items[0]).toMatchObject({
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
      });
    });

    describe("query", () => {
      let ids: string[];
      let pageIds: string[];
      beforeAll(async () => {
        ids = await createNews(
          {
            title: "Lorem ipsum dolor sit",
            slug: "ipsum"
          },
          {
            title: "Find me",
            date: "2018-09-30"
          },
          {
            title: "Find me too",
            date: "2018-10-01"
          }
        );

        const data1 = {
          ...sampleNews,
          title: "Lorem ipsum dolor"
        };

        // Create a second revision...
        const rev = await content.createRevision(
          data1,
          data1,
          news,
          models.content,
          ids[0],
          author
        );

        const data2 = {
          ...sampleNews,
          title: "Lorem ipsum"
        };
        // ...and a third one
        await content.createRevision(
          data2,
          data2,
          news,
          models.content,
          ids[0],
          author
        );

        // ...and publish it
        await content.setPublishedRev(news, ids[0], rev, models.content);

        pageIds = await createPages(
          {
            news: { id: ids[0], model: "news" },
            newsList: [
              { value: { id: ids[0], model: "news" } },
              { value: { id: ids[2], model: "news" } }
            ],
            stringList: [{ value: "Find Me" }, { value: "or me" }]
          },
          {
            news: { id: ids[1], model: "news" },
            newsList: [
              { value: { id: ids[1], model: "news" } },
              { value: { id: ids[2], model: "news" } }
            ],
            stringList: [{ value: "but not me" }, { value: "or me" }]
          }
        );
      });

      it("should query content", async () => {
        await expect(
          await content.list(
            news,
            models.content,
            {},
            {
              "data.title": { eq: "Lorem ipsum" }
            }
          )
        ).toMatchObject({ total: 1, items: [{ id: ids[0] }] });

        await expect(
          await content.list(
            news,
            models.content,
            {},
            {
              "data.date": { gt: "2018-09-13", lt: "2018-10-01" }
            }
          )
        ).toMatchObject({
          total: 1,
          items: [{ id: ids[1] }]
        });

        await expect(
          await content.list(
            pages,
            models.content,
            {},
            {
              "data.news": { eq: ids[1] }
            }
          )
        ).toMatchObject({
          total: 1,
          items: [{ id: pageIds[1] }]
        });

        await expect(
          await content.list(
            pages,
            models.content,
            {},
            {
              "data.newsList": { eq: ids[1] }
            }
          )
        ).toMatchObject({
          total: 1,
          items: [{ id: pageIds[1] }]
        });

        await expect(
          await content.list(
            pages,
            models.content,
            {},
            {
              "data.stringList": { eq: "Find Me" }
            }
          )
        ).toMatchObject({
          total: 1,
          items: [{ id: pageIds[0] }]
        });

        const data3 = {
          ...sampleNews,
          title: "Don't find me"
        };

        // Update previously found content
        await content.createRevision(
          data3,
          data3,
          news,
          models.content,
          ids[1],
          author
        );

        await expect(
          await content.list(
            news,
            models.content,
            {},
            {
              "data.title": { eq: "Find me" }
            }
          )
        ).toMatchObject({ total: 0 });

        // Query published content
        await content.setPublishedRev(news, ids[2], 1, models.content);
        await expect(
          await content.list(
            news,
            models.content,
            {},
            { "data.date": { gt: "2018-09-13" } },
            { publishedOnly: true }
          )
        ).toMatchObject({
          total: 1,
          items: [{ id: ids[2] }]
        });

        // Unpublish
        await content.setPublishedRev(news, ids[2], null, models.content);
        await expect(
          await content.list(
            news,
            models.content,
            {},
            { "data.date": { gt: "2018-09-13" } },
            { publishedOnly: true }
          )
        ).toMatchObject({ total: 0, items: [] });
      });

      it("should search", async () => {
        const res = await content.search("ipsum lore", false, {});
        expect(res).toMatchObject({
          total: 1,
          items: [{ type: "news", data: { title: "Lorem ipsum" } }]
        });
      });

      it("should not throw errors for specials chars in search", async () => {
        await content.search(" ", true, {});
        await content.search("+", true, {});
        await content.search("-", true, {});
        await content.search("~", true, {});
        await content.search("(~)", true, {});
        await content.search("hello- world ", true, {});
      });

      it("should find content by media", async () => {
        const image = "image.png";
        await media.create({
          id: image,
          size: 1234,
          originalname: "image.png",
          mimetype: "image/png",
          imagetype: "png",
          width: 100,
          height: 100
        });
        const [id] = await createNews({ image });
        expect(await content.findByMedia(image)).toMatchObject([
          { id, type: "news", data: { image } }
        ]);
      });
    });

    describe("constraints", () => {
      it("should create content", async () => {
        const id = await content.create(
          { slug: "unique" },
          { slug: "unique" },
          uniqueContent,
          models.content,
          author
        );
        await expect(id).toBeGreaterThan(0);
      });
      it("should not create content", async () => {
        await expect(
          content.create(
            { slug: "unique" },
            { slug: "unique" },
            uniqueContent,
            models.content,
            author
          )
        ).rejects.toBeInstanceOf(UniqueFieldError);
      });

      it("should be able to update content", async () => {
        const id = await content.create(
          { slug: "foo-bar-baz" },
          { slug: "foo-bar-baz" },
          uniqueContent,
          models.content,
          author
        );

        await expect(
          await content.createRevision(
            { slug: "foo-bar-baz" },
            { slug: "foo-bar-baz" },
            uniqueContent,
            models.content,
            id,
            author
          )
        ).not.toBeNaN();
      });
    });

    describe("scheduled content", () => {
      let id: string;
      beforeAll(async () => {
        [id] = await createNews({ title: "tttest" });
        await content.setPublishedRev(news, id, 1, models.content);
      });

      const expectToFindIt = async (
        contains: boolean,
        previewOpts: PreviewOpts
      ) => {
        const list = await content.list(
          news,
          models.content,
          {},
          undefined,
          previewOpts
        );
        const e = contains ? expect : expect.not;
        await expect(list).toMatchObject({
          items: e.arrayContaining([expect.objectContaining({ id })])
        });
      };

      it("should show unscheduled content", async () => {
        await expectToFindIt(true, { publishedOnly: true });
      });
      it("should hide future content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() + 600000)
        });
        await expectToFindIt(false, { publishedOnly: true });
      });
      it("should show future content if scheduled is ignored", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() + 100000)
        });
        await expectToFindIt(true, {
          publishedOnly: true,
          ignoreSchedule: true
        });
      });
      it("should show future content in preview", async () => {
        await expectToFindIt(true, { publishedOnly: false });
      });
      it("should show past content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() - 600000)
        });
        await expectToFindIt(true, { publishedOnly: true });
      });

      it("should load past content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() - 600000)
        });
        const c = await content.load(news, id, { publishedOnly: true });
        expect(c).not.toBeNull();
      });

      it("should not show expired content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() - 600000),
          visibleUntil: new Date(Date.now() - 300000)
        });
        await expectToFindIt(false, { publishedOnly: true });
      });

      it("should not load expired content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() - 600000),
          visibleUntil: new Date(Date.now() - 300000)
        });
        const c = await content.load(news, id, { publishedOnly: true });
        expect(c).toBeNull();
      });

      it("should not load future content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() + 600000)
        });
        const c = await content.load(news, id, { publishedOnly: true });
        expect(c).toBeNull();
      });

      it("should search past content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() - 600000)
        });
        const c = await content.search(
          "tttest",
          true,
          { models: ["news"] },
          { publishedOnly: true }
        );
        expect(c.total).toBe(1);
      });

      it("should not search expired content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() - 600000),
          visibleUntil: new Date(Date.now() - 300000)
        });
        const c = await content.search(
          "tttest",
          true,
          { models: ["news"] },
          { publishedOnly: true }
        );
        expect(c.total).toBe(0);
      });

      it("should not search future content", async () => {
        await content.schedule(news, id, {
          visibleFrom: new Date(Date.now() + 600000)
        });
        const c = await content.search(
          "tttest",
          true,
          { models: ["news"] },
          { publishedOnly: true }
        );
        expect(c.total).toBe(0);
      });
    });

    describe("migrations", () => {
      it("should rewrite data", async () => {
        const ids = await createNews(
          {
            title: "News 1"
          },
          {
            title: "News 2"
          },
          {
            title: "News 3"
          }
        );
        await content.rewrite(news, models.content, async (data, meta) => {
          if (ids.includes(meta.id)) {
            return {
              storeData: { ...data, title: data.title.toUpperCase() },
              searchData: {}
            };
          }
        });
        const c = await content.load(news, ids[0]);
        expect(c).toMatchObject({ data: { title: "NEWS 1" } });
      });
    });

    it("should perform a migration only once", async () => {
      const execute = jest.fn();
      const callback = jest.fn();
      await content.migrate([{ name: "aaa", execute }], callback);
      await content.migrate([{ name: "aaa", execute }], callback);
      expect(callback).toBeCalledTimes(1);
    });

    it("should wait for migrations to finish", async () => {
      const execute = jest.fn();
      const callback = jest.fn<Promise<void>, any>(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      await Promise.all([
        content.migrate([{ name: "bbb", execute }], callback),
        content.migrate([{ name: "bbb", execute }], callback)
      ]);
      expect(callback).toBeCalledTimes(1);
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

    let author: string;

    beforeAll(async () => {
      await media.create(image1);
      await media.create(image2);
      await media.create(image3);
      const role = await createRole("media-test");
      author = await settings.create(users, {
        role,
        name: "Media Test",
        email: "media@example.com",
        password: "xxx"
      });
    });

    it("should create media", async () => {
      const image = {
        id: "createImage.jpg",
        size: 1000,
        originalname: "world.jpg",
        mimetype: "image/jpeg",
        imagetype: "jpeg",
        width: 800,
        height: 600
      };

      await media.create(image);
      expect(await media.load([image.id])).toMatchObject([
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
    });

    it("should update media", async () => {
      const image = {
        id: "updateMe.exe",
        size: 1000,
        originalname: "world.jpg",
        mimetype: "image/jpeg",
        imagetype: "jpeg",
        width: 800,
        height: 600
      };
      await media.create(image);

      await media.update(image.id, {
        focusX: 10,
        focusY: 10,
        tags: ["foo", "bar", "baz"],
        credit: "Mother of Dragons",
        alt: "Winter is coming"
      } as Media);

      expect(await media.load([image.id])).toMatchObject([
        {
          id: "updateMe.exe",
          size: 1000,
          originalname: "world.jpg",
          mimetype: "image/jpeg",
          imagetype: "jpeg",
          width: 800,
          height: 600,
          search: "foo bar baz world.jpg",
          hash: null,
          focusX: 10,
          focusY: 10,
          tags: ["foo", "bar", "baz"],
          credit: "Mother of Dragons",
          alt: "Winter is coming"
        }
      ]);
    });

    it("should list media", async () => {
      const list = await media.list({});
      expect(list).toMatchObject({
        items: expect.arrayContaining([expect.objectContaining(image1)])
      });
    });

    it("should find media", async () => {
      const list = await media.list({ search: "hell" });
      expect(list).toMatchObject({
        total: 1,
        items: expect.arrayContaining([expect.objectContaining(image1)])
      });
    });

    it("should not delete media in use", async () => {
      const id = (await content.create(
        { title: "News", image: image1.id },
        { title: "News", image: image1.id },
        news,
        models.content,
        author
      )) as string;

      await expect(
        media.delete(image1.id, models.content)
      ).rejects.toBeInstanceOf(ReferenceConflictError);

      await content.setPublishedRev(news, id, 1, models.content);

      const data = {
        title: "News Rev 2",
        image: null
      };

      await content.createRevision(
        data,
        data,
        news,
        models.content,
        id,
        author
      );

      await expect(
        media.delete(image1.id, models.content)
      ).rejects.toBeInstanceOf(ReferenceConflictError);

      const data2 = { title: "News", image: image3.id };
      const id2 = (await content.create(
        data2,
        data2,
        news,
        models.content,
        author
      )) as string;

      const data3 = {
        title: "News Rev 2",
        image: image3.id
      };
      await content.createRevision(
        data3,
        data3,
        news,
        models.content,
        id2,
        author
      );

      await content.setPublishedRev(news, id2, 2, models.content);

      const data4 = {
        title: "News Rev 3",
        image: image3.id
      };
      await content.createRevision(
        data4,
        data4,
        news,
        models.content,
        id2,
        author
      );

      await expect(
        media.delete(image3.id, models.content)
      ).rejects.toBeInstanceOf(ReferenceConflictError);
    });

    it("should delete previous but not anymore used media", async () => {
      const image = {
        id: "delete.jpg",
        size: 1000,
        originalname: "world.jpg",
        mimetype: "image/jpeg",
        imagetype: "jpeg",
        width: 800,
        height: 600
      };

      await media.create(image);

      const id = (await content.create(
        { title: "News", image: image.id },
        { title: "News", image: image.id },
        news,
        models.content,
        author
      )) as string;

      await content.delete(news, id);

      await media.delete(image.id, models.content);
    });

    it("should delete media when model doesn't exist anymore", async () => {
      const image = {
        id: "deleteIfYouCan.jpg",
        size: 1000,
        originalname: "world.jpg",
        mimetype: "image/jpeg",
        imagetype: "jpeg",
        width: 800,
        height: 600
      };

      await media.create(image);

      await content.create(
        { title: "News", image: image.id },
        { title: "News", image: image.id },
        news,
        models.content,
        author
      );

      await expect(
        media.delete(image.id, models.content)
      ).rejects.toBeInstanceOf(ReferenceConflictError);

      const newModels = models.content.slice();

      newModels.shift();
      await media.delete(image.id, newModels);
    });
  });
});
