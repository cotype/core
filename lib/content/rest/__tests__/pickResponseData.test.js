"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pickFieldsFromResultData_1 = __importDefault(require("../pickFieldsFromResultData"));
const contentRef = {
    _content: "document",
    _id: 853,
    _ref: "content"
};
const mediaRef = {
    id: "abc.pdf",
    size: 12345
};
const data = {
    id: "1",
    data: {
        _id: "1",
        foo: "some fooish text",
        bar: {
            baz: 12
        },
        fooBar: {
            _id: mediaRef.id,
            _ref: "media",
            _src: "https://barbar.baz/abc.pdf"
        },
        bazn: contentRef
    },
    type: "foo",
    author: "bar",
    date: "baz"
};
const _mediaRefs = {
    [mediaRef.id]: mediaRef
};
const _contentRefs = {
    [contentRef._content]: {
        [contentRef._id]: {
            someProps: "props"
        }
    }
};
const _refs = {
    media: _mediaRefs,
    content: _contentRefs
};
const singleContent = {
    ...data,
    _refs
};
const listOfContent = {
    total: 1,
    items: [data],
    _refs
};
describe("pickFieldsFromResultData", () => {
    describe("pick single content", () => {
        it("should return full response", async () => {
            await expect((0, pickFieldsFromResultData_1.default)(singleContent, [])).toEqual(expect.objectContaining(singleContent));
        });
        it("should return only selected fields", async () => {
            const { fooBar, bazn, ...restData } = data.data;
            await expect((0, pickFieldsFromResultData_1.default)(singleContent, ["foo", "bar", "bazn"])).toEqual(expect.objectContaining({
                ...singleContent,
                data: { ...restData, bazn },
                _refs
            }));
            await expect((0, pickFieldsFromResultData_1.default)(singleContent, ["foo", "bar"])).toEqual(expect.objectContaining({
                ...singleContent,
                data: { ...restData },
                _refs
            }));
        });
    });
    describe("pick list of content", () => {
        it("should return full response", async () => {
            await expect((0, pickFieldsFromResultData_1.default)(listOfContent, [])).toEqual(expect.objectContaining(listOfContent));
        });
        it("should return only selected fields", async () => {
            const { fooBar, bazn, ...restData } = data.data;
            await expect((0, pickFieldsFromResultData_1.default)(listOfContent, ["foo", "bar", "bazn"])).toEqual(expect.objectContaining({
                total: 1,
                items: [{ ...data, data: { ...restData, bazn } }],
                _refs
            }));
            await expect((0, pickFieldsFromResultData_1.default)(listOfContent, ["foo", "bar"])).toEqual(expect.objectContaining({
                total: 1,
                items: [{ ...data, data: { ...restData } }],
                _refs
            }));
        });
    });
});
//# sourceMappingURL=pickResponseData.test.js.map