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
const path_1 = __importDefault(require("path"));
const tempy_1 = __importDefault(require("tempy"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const supertest_1 = __importDefault(require("supertest"));
const __1 = require("../../..");
const util_1 = require("../../../__tests__/util");
const FsStorage_1 = __importDefault(require("../../../media/storage/FsStorage"));
const local_thumbnail_provider_1 = __importDefault(require("@cotype/local-thumbnail-provider"));
const faker_1 = __importDefault(require("faker"));
const apiHelper_1 = require("./apiHelper");
const uploadDir = path_1.default.join(__dirname, ".uploads");
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
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const storage = new FsStorage_1.default(uploadDir);
        ({ app, persistence } = yield (0, __1.init)({
            models: [modelA, modelB, modelC, modelD],
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
        ({ server, headers } = yield (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin"));
        ({ find } = (0, apiHelper_1.createApiReadHelpers)(server));
        ({ create, schedule, publish } = (0, apiHelper_1.createApiWriteHelpers)(server, headers));
        c = yield create(modelC.name, {
            title: faker_1.default.lorem.slug()
        });
        b = yield create(modelB.name, {
            title: faker_1.default.lorem.slug(),
            refC: { id: c.id, model: modelC.name }
        });
        a = yield create(modelA.name, {
            title: faker_1.default.lorem.slug(),
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
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield fs_extra_1.default.remove(uploadDir);
        return persistence.shutdown();
    }));
    it("should join content", () => __awaiter(void 0, void 0, void 0, function* () {
        const resp = yield find(modelA.name, a.id, { join: { B: ["refC.title"] } }, false);
        yield expect(resp).toStrictEqual(expectedResponseForA);
    }));
    it("should join content with wrong casing", () => __awaiter(void 0, void 0, void 0, function* () {
        const resp = yield find(modelA.name, a.id, { join: { b: ["refC.title"] } }, false);
        yield expect(resp).toStrictEqual(expectedResponseForA);
    }));
    it("should join refs with urls when model is containing an urlPath", () => __awaiter(void 0, void 0, void 0, function* () {
        const resp = yield find(modelA.name, a.id, { join: { B: ["refC"] } }, false);
        yield expect(resp).toMatchObject({
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
    }));
    it("should not include reverse refs", () => __awaiter(void 0, void 0, void 0, function* () {
        yield publish(modelC.name, c.id);
        yield publish(modelB.name, b.id);
        yield publish(modelA.name, a.id);
        yield schedule(modelC.name, c.id, {
            visibleUntil: new Date(Date.now() - 1)
        });
        const resp1 = yield find(modelA.name, a.id, { join: { B: ["refC"] } }, true);
        yield expect(resp1).toStrictEqual(Object.assign(Object.assign({}, expectedResponseForA), { _refs: Object.assign(Object.assign({}, expectedResponseForA._refs), { content: {
                    [modelB.name]: {
                        [b.id]: {
                            _id: b.id,
                            _type: modelB.name
                        }
                    }
                } }) }));
        yield schedule(modelB.name, b.id, {
            visibleUntil: new Date(Date.now() - 1)
        });
        const resp2 = yield find(modelA.name, a.id, { join: { B: ["refC"] } }, true);
        yield expect(resp2).toStrictEqual({
            _id: a.id,
            title: expectedResponseForA.title,
            _refs: {
                media: {},
                content: {}
            }
        });
        // Should also works with array of refs
        const c2 = yield create(modelC.name, {
            title: faker_1.default.lorem.slug()
        });
        yield publish(modelC.name, c2.id);
        const d = yield create(modelD.name, {
            title: faker_1.default.lorem.slug(),
            refs: [
                { key: 1, value: { id: c.id, model: modelC.name } },
                { key: 2, value: { id: c2.id, model: modelC.name } }
            ]
        });
        yield publish(modelD.name, d.id);
        yield expect(yield find(modelD.name, d.id, { join: { C: ["title"] } }, true)).toStrictEqual({
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
    }));
    it("should not include expired refs", () => __awaiter(void 0, void 0, void 0, function* () {
        const contentC = yield create(modelC.name, {
            title: faker_1.default.lorem.slug()
        });
        const contentB = yield create(modelB.name, {
            title: faker_1.default.lorem.slug(),
            refC: { id: contentC.id, model: modelC.name }
        });
        yield publish(modelC.name, contentC.id);
        yield publish(modelB.name, contentB.id);
        expect(yield find(modelC.name, contentC.id, {}, true)).toStrictEqual({
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
        yield schedule(modelB.name, contentB.id, {
            visibleUntil: new Date(Date.now() - 1)
        });
        yield expect(yield find(modelC.name, contentC.id, {}, true)).toStrictEqual({
            _id: contentC.id,
            _refs: { content: {}, media: {} },
            reverseRef: [],
            title: contentC.data.title
        });
    }));
});
//# sourceMappingURL=joins.test.js.map