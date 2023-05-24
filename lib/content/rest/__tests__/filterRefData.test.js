"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const filterRefData_1 = __importStar(require("../filterRefData"));
const models_1 = __importDefault(require("./models"));
const faker_1 = __importDefault(require("faker"));
describe("removeUnnecessaryRefData", () => {
    const join = {
        "*ews": ["title", "slug"],
        fooBar: ["baz"],
        "*ucts": ["ean"]
    };
    const newsData = {
        data: {
            title: faker_1.default.random.words(4),
            slug: faker_1.default.lorem.slug(3),
            date: new Date().toString(),
            image: { _id: faker_1.default.system.fileName() },
            imageList: [{ key: 1, value: { _id: faker_1.default.system.fileName() } }],
            refs: {
                _id: 2,
                _ref: "content",
                _content: "products"
            }
        },
        id: "1",
        type: "news",
        author: "",
        date: ""
    };
    const productData = {
        data: {
            title: faker_1.default.lorem.words(4),
            ean: faker_1.default.random.number(),
            description: faker_1.default.lorem.words(4),
            image: faker_1.default.system.fileName()
        },
        id: "2",
        type: "products",
        author: "",
        date: ""
    };
    it("createJoin", async () => {
        const createdJoin = (0, filterRefData_1.createJoin)(join, models_1.default);
        await expect(createdJoin).toStrictEqual({
            news: ["title", "slug"],
            articlenews: ["title", "slug"],
            products: ["ean"]
        });
    });
    it("filteredContentData", async () => {
        const createdJoin = (0, filterRefData_1.createJoin)(join, models_1.default);
        const filteredContent = (0, filterRefData_1.filterContentData)(newsData, createdJoin);
        await expect(filteredContent).toMatchObject({
            title: newsData.data.title,
            slug: newsData.data.slug,
            _id: "1",
            _type: "news"
        });
    });
    it("getContainingMedia", async () => {
        const mediaRefs = {
            [newsData.data.image._id]: { someCrazyProps: "forBar" },
            [newsData.data.imageList[0]._id]: { someCrazyProps: "forBar2" },
            [faker_1.default.random.image()]: { someCrazyProps: "forBar3" },
            [faker_1.default.random.image()]: { someCrazyProps: "forBar4" }
        };
        const containingMedia = (0, filterRefData_1.getContainingMedia)(newsData, models_1.default[0], mediaRefs);
        await expect(containingMedia).toStrictEqual({
            [newsData.data.image._id]: { someCrazyProps: "forBar" },
            [newsData.data.imageList[0]._id]: { someCrazyProps: "forBar2" }
        });
    });
    it("removeUnnecessaryRefData", async () => {
        const meta = {
            size: 6548,
            originalname: "header-transparent.svg",
            mimetype: "image/svg+xml",
            imagetype: "svg",
            width: 124,
            height: 124,
            focusX: null,
            focusY: null,
            tags: null,
            search: " header-transparent.svg",
            created_at: "2019-02-14 16:45:01",
            hash: "e7b33f19085432c54fc57ef2a6fb1784"
        };
        const refs = {
            content: {
                news: {
                    1: newsData
                },
                products: {
                    2: productData
                }
            },
            media: {
                [newsData.data.image._id]: { ...meta, id: newsData.data.image._id },
                [faker_1.default.system.fileName()]: { ...meta, id: "image2.exe" }
            }
        };
        const cleanRefs = (0, filterRefData_1.default)([newsData, productData], refs, join, models_1.default);
        await expect(cleanRefs).toStrictEqual({
            content: {
                news: {
                    "1": {
                        _id: "1",
                        _type: "news",
                        slug: newsData.data.slug,
                        title: newsData.data.title
                    }
                },
                products: {
                    "2": { ean: productData.data.ean, _id: "2", _type: "products" }
                }
            },
            media: {
                [newsData.data.image._id]: { ...meta, id: newsData.data.image._id }
            }
        });
    });
});
describe("convertDeepJons", () => {
    it("get Join Levels", async () => {
        const deepJoins = (0, filterRefData_1.getDeepJoins)({
            news: ["title", "ref.ean"]
        }, models_1.default);
        await expect(deepJoins).toStrictEqual([
            {
                news: ["title", "ref"]
            },
            {
                products: ["ean"]
            }
        ]);
    });
    it("get Join Levels with List", async () => {
        const deepJoins = (0, filterRefData_1.getDeepJoins)({
            products: ["title", "sections.title"]
        }, models_1.default);
        await expect(deepJoins).toStrictEqual([
            {
                products: ["title", "sections"]
            },
            {
                section: ["title"]
            }
        ]);
    });
    it("get Join Levels with List 2-Levels", async () => {
        const deepJoins = (0, filterRefData_1.getDeepJoins)({
            news: ["title", "ref.title", "ref.sections.title"]
        }, models_1.default);
        await expect(deepJoins).toStrictEqual([
            {
                news: ["title", "ref"]
            },
            {
                products: ["title", "sections"]
            },
            {
                section: ["title"]
            }
        ]);
    });
});
//# sourceMappingURL=filterRefData.test.js.map