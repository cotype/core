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
const faker_1 = __importDefault(require("faker"));
const __1 = require("../..");
const local_thumbnail_provider_1 = __importDefault(require("@cotype/local-thumbnail-provider"));
const supertest_1 = __importDefault(require("supertest"));
const tempy = require("tempy");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const util_1 = require("../../__tests__/util");
const apiHelper_1 = require("../rest/__tests__/apiHelper");
const uploadDir = path_1.default.join(__dirname, ".uploads");
const dummyData = {
    title: faker_1.default.random.words(5),
    indexButDontStore: faker_1.default.name.firstName()
};
const model = {
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
    let app;
    let persistence;
    let server;
    let headers;
    let find;
    let search;
    let create;
    let update;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const storage = new __1.FsStorage(uploadDir);
        ({ app, persistence } = yield (0, __1.init)({
            models: [model],
            thumbnailProvider: new local_thumbnail_provider_1.default(storage),
            storage,
            persistenceAdapter: (0, __1.knexAdapter)({
                client: "sqlite3",
                connection: {
                    filename: tempy.file()
                },
                useNullAsDefault: true
            })
        }));
        ({ server, headers } = yield (0, util_1.login)((0, supertest_1.default)(app), "admin@cotype.dev", "admin"));
        ({ create, update } = (0, apiHelper_1.createApiWriteHelpers)(server, headers));
        ({ find, search } = (0, apiHelper_1.createApiReadHelpers)(server));
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield fs_extra_1.default.remove(uploadDir);
        return persistence.shutdown();
    }));
    it("should not store flagged fields", () => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield create("noStore", dummyData);
        expect(data).toStrictEqual({
            id: data.id,
            data: { title: dummyData.title }
        });
        const updatedData = yield update("noStore", data.id, dummyData);
        expect(updatedData).toStrictEqual({
            id: data.id,
            data: { title: dummyData.title }
        });
        const foundData = yield find("noStore", data.id, {}, false);
        expect(foundData).toStrictEqual({
            title: dummyData.title,
            _id: data.id,
            _refs
        });
    }));
    it("should index flagged fields", () => __awaiter(void 0, void 0, void 0, function* () {
        const foundData = yield search(dummyData.indexButDontStore, {
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
    }));
});
//# sourceMappingURL=indexNoStore.test.js.map