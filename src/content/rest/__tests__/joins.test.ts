import path from "path";
import tempy from "tempy";
import fs from "fs-extra";
import request from "supertest";
import { init, Persistence, knexAdapter } from "../../..";
import { login } from "../../../__tests__/util";
import FsStorage from "../../../media/storage/FsStorage";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";
import faker from "faker";
import { ModelOpts } from "../../../../typings";
import { createApiReadHelpers, createApiWriteHelpers } from "./apiHelper";

const uploadDir = path.join(__dirname, ".uploads");

const modelA: ModelOpts = {
  name: "A",
  urlPath: "/path/to/:title",
  fields: {
    title: { type: "string" },
    refB: { type: "content", models: ["B"] }
  }
};
const modelB: ModelOpts = {
  name: "B",
  urlPath: "/path/to/:title",
  fields: {
    title: { type: "string" },
    refC: { type: "content", models: ["C"] }
  }
};
const modelC: ModelOpts = {
  name: "C",
  urlPath: "/path/to/:title",
  fields: {
    title: { type: "string" }
  }
};

describe("joins", () => {
  let app: any;
  let persistence: Persistence;
  let server: request.SuperTest<request.Test>;
  let headers: object;
  let find: ReturnType<typeof createApiReadHelpers>["find"];
  let create: ReturnType<typeof createApiWriteHelpers>["create"];

  let a: any;
  let b: any;
  let c: any;

  let expectedResponse: any;

  beforeAll(async () => {
    const storage = new FsStorage(uploadDir);

    ({ app, persistence } = await init({
      models: [modelA, modelB, modelC],
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

    ({ find } = createApiReadHelpers(server));
    ({ create } = createApiWriteHelpers(server, headers));

    c = await create(modelC.name, {
      title: faker.lorem.slug()
    });

    b = await create(modelB.name, {
      title: faker.lorem.slug(),
      refC: { id: c.id, model: modelC.name }
    });

    a = await create(modelA.name, {
      title: faker.lorem.slug(),
      refB: { id: b.id, model: modelB.name }
    });

    expectedResponse = {
      _id: a.id,
      _refs: {
        content: {
          B: {
            [b.id]: {
              _id: b.id,
              _type: modelB.name,
              refC: {
                _content: modelC.name,
                _id: c.id,
                _ref: "content",
                _url: `/path/to/${c.data.title}`
              }
            }
          },
          C: {
            [c.id]: {
              _id: c.id,
              _type: modelC.name,
              title: c.data.title
            }
          }
        },
        media: {}
      },
      refB: {
        _content: modelB.name,
        _id: b.id,
        _ref: "content",
        _url: `/path/to/${b.data.title}`
      },
      title: a.data.title
    };
  });

  afterAll(async () => {
    await fs.remove(uploadDir);
    return persistence.shutdown();
  });

  it("should join content", async () => {
    const resp = await find(
      modelA.name,
      a.id,
      { join: { B: ["refC.title"] } },
      false
    );

    await expect(resp).toStrictEqual(expectedResponse);
  });

  it("should join content with wrong casing", async () => {
    const resp = await find(
      modelA.name,
      a.id,
      { join: { b: ["refC.title"] } },
      false
    );

    await expect(resp).toStrictEqual(expectedResponse);
  });

  it("should join refs with urls when model is containing an urlPath", async () => {
    const resp = await find(
      modelA.name,
      a.id,
      { join: { B: ["refC"] } },
      false
    );

    await expect(resp).toMatchObject({
      _refs: {
        content: {
          B: {
            [b.id]: {
              _id: b.id,
              _type: modelB.name,
              refC: {
                _content: modelC.name,
                _id: c.id,
                _ref: "content",
                _url: `/path/to/${c.data.title}`
              }
            }
          }
        },
        media: {}
      }
    });
  });
});
