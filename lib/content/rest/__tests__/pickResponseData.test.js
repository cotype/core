"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
const singleContent = Object.assign(Object.assign({}, data), { _refs });
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
            const _a = data.data, { fooBar, bazn } = _a, restData = __rest(_a, ["fooBar", "bazn"]);
            await expect((0, pickFieldsFromResultData_1.default)(singleContent, ["foo", "bar", "bazn"])).toEqual(expect.objectContaining(Object.assign(Object.assign({}, singleContent), { data: Object.assign(Object.assign({}, restData), { bazn }), _refs })));
            await expect((0, pickFieldsFromResultData_1.default)(singleContent, ["foo", "bar"])).toEqual(expect.objectContaining(Object.assign(Object.assign({}, singleContent), { data: Object.assign({}, restData), _refs })));
        });
    });
    describe("pick list of content", () => {
        it("should return full response", async () => {
            await expect((0, pickFieldsFromResultData_1.default)(listOfContent, [])).toEqual(expect.objectContaining(listOfContent));
        });
        it("should return only selected fields", async () => {
            const _a = data.data, { fooBar, bazn } = _a, restData = __rest(_a, ["fooBar", "bazn"]);
            await expect((0, pickFieldsFromResultData_1.default)(listOfContent, ["foo", "bar", "bazn"])).toEqual(expect.objectContaining({
                total: 1,
                items: [Object.assign(Object.assign({}, data), { data: Object.assign(Object.assign({}, restData), { bazn }) })],
                _refs
            }));
            await expect((0, pickFieldsFromResultData_1.default)(listOfContent, ["foo", "bar"])).toEqual(expect.objectContaining({
                total: 1,
                items: [Object.assign(Object.assign({}, data), { data: Object.assign({}, restData) })],
                _refs
            }));
        });
    });
});
//# sourceMappingURL=pickResponseData.test.js.map