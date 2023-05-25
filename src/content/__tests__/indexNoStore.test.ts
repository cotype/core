import { ModelOpts, Data } from "../../../typings";
import faker from "faker";
import { FsStorage, init, knexAdapter } from "../..";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";

import request from "supertest";
import tempy from "tempy";
import { Persistence } from "../../persistence";
import fs from "fs-extra";

import path from "path";
import { login } from "../../__tests__/util";
import {
  createApiWriteHelpers,
  createApiReadHelpers
} from "../rest/__tests__/apiHelper";

const uploadDir = path.join(__dirname, ".uploads");

const dummyData: Data = {
  title: faker.random.words(5),
  indexButDontStore: faker.name.firstName()
};

const model: ModelOpts = {
  name: "noStore",
  fields: {
    title: { type: "string" },
    indexButDontStore: { type: "string", store: false }
  }
};

const _refs = {
  content: {},
  media: {}
};

describe("Index fields but don't store them in revisions", () => {
  let app: any;
  let persistence: Persistence;
  let server: request.SuperTest<request.Test>;
  let headers: object;
  let find: ReturnType<typeof createApiReadHelpers>["find"];
  let search: ReturnType<typeof createApiReadHelpers>["search"];
  let create: ReturnType<typeof createApiWriteHelpers>["create"];
  let update: ReturnType<typeof createApiWriteHelpers>["update"];

  beforeAll(async () => {
    const storage = new FsStorage(uploadDir);

    ({ app, persistence } = await init({
      models: [model],
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

    ({ create, update } = createApiWriteHelpers(server, headers));
    ({ find, search } = createApiReadHelpers(server));
  });

  afterAll(async () => {
    await fs.remove(uploadDir);
    return persistence.shutdown();
  });

  it("should not store flagged fields", async () => {
    const data = await create("noStore", dummyData);
    expect(data).toStrictEqual({
      id: data.id,
      data: { title: dummyData.title }
    });

    const updatedData = await update("noStore", data.id, dummyData);
    expect(updatedData).toStrictEqual({
      id: data.id,
      data: { title: dummyData.title }
    });

    const foundData = await find("noStore", data.id, {}, false);
    expect(foundData).toStrictEqual({
      title: dummyData.title,
      _id: data.id,
      _refs
    });
  });

  it("should index flagged fields", async () => {
    const foundData = await search(dummyData.indexButDontStore, {
      linkableOnly: false,
      published: false
    });

    expect(foundData).toStrictEqual({
      total: 1,
      items: [
        {
          title: dummyData.title,
          id: expect.any(Number),
          image: {
            _ref: "media",
            _src: null
          }
        }
      ],
      _refs
    });
  });
});
