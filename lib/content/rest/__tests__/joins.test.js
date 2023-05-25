import path from "path";
import tempy from "tempy";
import fs from "fs-extra";
import request from "supertest";
import { init, knexAdapter } from "../../..";
import { login } from "../../../__tests__/util";
import FsStorage from "../../../media/storage/FsStorage";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";
import faker from "faker";
import { createApiReadHelpers, createApiWriteHelpers } from "./apiHelper";
const uploadDir = path.join(__dirname, ".uploads");
const modelA = {
    name: "A",
    urlPath: "/path/to/:title",
    fields: {
        title: { type: "string" },
        refB: { type: "content", models: ["B"] }
    }
};
const modelB = {
    name: "B",
    urlPath: "/path/to/:title",
    fields: {
        title: { type: "string" },
        refC: { type: "content", models: ["C"] }
    }
};
const modelC = {
    name: "C",
    urlPath: "/path/to/:title",
    fields: {
        title: { type: "string" },
        reverseRef: { type: "references", model: "B", fieldName: "refC" }
    }
};
const modelD = {
    name: "D",
    urlPath: "/path/to/:title",
    fields: {
        title: { type: "string" },
        refs: {
            type: "list",
            item: {
                type: "content",
                models: ["C"]
            }
        }
    }
};
describe("joins", () => {
    let app;
    let persistence;
    let server;
    let headers;
    let find;
    let create;
    let schedule;
    let publish;
    let a;
    let b;
    let c;
    let expectedResponseForA;
    beforeAll(async () => {
        const storage = new FsStorage(uploadDir);
        ({ app, persistence } = await init({
            models: [modelA, modelB, modelC, modelD],
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
        ({ server, headers } = await login(request(app), "admin@cotype.dev", "admin"));
        ({ find } = createApiReadHelpers(server));
        ({ create, schedule, publish } = createApiWriteHelpers(server, headers));
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
        expectedResponseForA = {
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
        const resp = await find(modelA.name, a.id, { join: { B: ["refC.title"] } }, false);
        await expect(resp).toStrictEqual(expectedResponseForA);
    });
    it("should join content with wrong casing", async () => {
        const resp = await find(modelA.name, a.id, { join: { b: ["refC.title"] } }, false);
        await expect(resp).toStrictEqual(expectedResponseForA);
    });
    it("should join refs with urls when model is containing an urlPath", async () => {
        const resp = await find(modelA.name, a.id, { join: { B: ["refC"] } }, false);
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
    it("should not include reverse refs", async () => {
        await publish(modelC.name, c.id);
        await publish(modelB.name, b.id);
        await publish(modelA.name, a.id);
        await schedule(modelC.name, c.id, {
            visibleUntil: new Date(Date.now() - 1)
        });
        const resp1 = await find(modelA.name, a.id, { join: { B: ["refC"] } }, true);
        await expect(resp1).toStrictEqual(Object.assign(Object.assign({}, expectedResponseForA), { _refs: Object.assign(Object.assign({}, expectedResponseForA._refs), { content: {
                    [modelB.name]: {
                        [b.id]: {
                            _id: b.id,
                            _type: modelB.name
                        }
                    }
                } }) }));
        await schedule(modelB.name, b.id, {
            visibleUntil: new Date(Date.now() - 1)
        });
        const resp2 = await find(modelA.name, a.id, { join: { B: ["refC"] } }, true);
        await expect(resp2).toStrictEqual({
            _id: a.id,
            title: expectedResponseForA.title,
            _refs: {
                media: {},
                content: {}
            }
        });
        // Should also works with array of refs
        const c2 = await create(modelC.name, {
            title: faker.lorem.slug()
        });
        await publish(modelC.name, c2.id);
        const d = await create(modelD.name, {
            title: faker.lorem.slug(),
            refs: [
                { key: 1, value: { id: c.id, model: modelC.name } },
                { key: 2, value: { id: c2.id, model: modelC.name } }
            ]
        });
        await publish(modelD.name, d.id);
        await expect(await find(modelD.name, d.id, { join: { C: ["title"] } }, true)).toStrictEqual({
            _id: d.id,
            title: d.data.title,
            refs: [
                {
                    _id: c2.id,
                    _content: modelC.name,
                    _ref: "content",
                    _url: `/path/to/${c2.data.title}`
                }
            ],
            _refs: {
                media: {},
                content: {
                    [modelC.name]: {
                        [c2.id]: {
                            _id: c2.id,
                            _type: modelC.name,
                            title: c2.data.title
                        }
                    }
                }
            }
        });
    });
    it("should not include expired refs", async () => {
        const contentC = await create(modelC.name, {
            title: faker.lorem.slug()
        });
        const contentB = await create(modelB.name, {
            title: faker.lorem.slug(),
            refC: { id: contentC.id, model: modelC.name }
        });
        await publish(modelC.name, contentC.id);
        await publish(modelB.name, contentB.id);
        expect(await find(modelC.name, contentC.id, {}, true)).toStrictEqual({
            _id: contentC.id,
            _refs: { content: {}, media: {} },
            reverseRef: [
                {
                    _content: modelB.name,
                    _id: contentB.id,
                    _ref: "content",
                    _url: `/path/to/${contentB.data.title}`
                }
            ],
            title: contentC.data.title
        });
        await schedule(modelB.name, contentB.id, {
            visibleUntil: new Date(Date.now() - 1)
        });
        await expect(await find(modelC.name, contentC.id, {}, true)).toStrictEqual({
            _id: contentC.id,
            _refs: { content: {}, media: {} },
            reverseRef: [],
            title: contentC.data.title
        });
    });
});
//# sourceMappingURL=joins.test.js.map