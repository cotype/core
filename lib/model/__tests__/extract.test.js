"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extractValues_1 = __importDefault(require("../extractValues"));
const modelData_1 = require("./modelData");
const extractText_1 = __importDefault(require("../extractText"));
const extractRefs_1 = __importDefault(require("../extractRefs"));
const getPositionFields_1 = __importDefault(require("../getPositionFields"));
const getAlwaysUniqueFields_1 = __importDefault(require("../getAlwaysUniqueFields"));
describe("extractValues", () => {
    it("should extract correct Values from Data (uniqueFields, PositionField, orderBy Field, TitleField, indexed Fields)", () => {
        expect((0, extractValues_1.default)(modelData_1.data, modelData_1.model)).toEqual({
            name: "Test",
            pos: "abc",
            slug: "test",
            immut: "test2",
            "test.pos2": "abcd",
            "test.field1": 3,
            "test.field2": "test3",
            "test.field3": true,
            "test.field4": ["Hallo", "Liste"],
            "test.field5.test": "hallo",
            test2: ["Hallo2", "Liste2"],
            empty: "null",
            contentList: [456, 789, 123]
        });
    });
    it("should extract all text", () => {
        expect((0, extractText_1.default)(modelData_1.data, modelData_1.model)).toEqual("Test test test2 3 test3 Hallo Liste hallo Hallo2 Liste2 asd asd ads");
    });
    it("should extract all references", () => {
        expect((0, extractRefs_1.default)(modelData_1.data, modelData_1.model, [modelData_1.model])).toEqual([
            { content: 123, optional: true, fieldNames: "ref~contentList" },
            { content: 321, optional: false },
            { content: 456, optional: true, fieldNames: "contentList" },
            { content: 789, optional: true, fieldNames: "contentList" }
        ]);
    });
    it("should get All PositionFields", () => {
        expect((0, getPositionFields_1.default)(modelData_1.model)).toEqual(["pos", "test.pos2"]);
    });
    it("should get All UniqueFields (+PositionFields)", () => {
        expect((0, getAlwaysUniqueFields_1.default)(modelData_1.model)).toEqual([
            "slug",
            "test.field5.test",
            "pos",
            "test.pos2"
        ]);
    });
});
//# sourceMappingURL=extract.test.js.map