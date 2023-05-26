"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getRefUrl_1 = __importDefault(require("../getRefUrl"));
describe("getRefUrl", () => {
    it("It should return url with slug", () => {
        const data = {
            a: "foo",
            b: { a: "nestedslug" },
            slugz: "foobarbaz"
        };
        const url1 = (0, getRefUrl_1.default)(data, "/foo/bar/baz/:slugz");
        expect(url1).toBe("/foo/bar/baz/foobarbaz");
        const url2 = (0, getRefUrl_1.default)(data, "/foo/bar/baz/:b.a");
        expect(url2).toBe("/foo/bar/baz/nestedslug");
        const url3 = (0, getRefUrl_1.default)(data, "/:a");
        expect(url3).toBe("/foo");
        const url4 = (0, getRefUrl_1.default)(data, "/foo/bar/baz/:slugz/:a");
        expect(url4).toBe("/foo/bar/baz/foobarbaz/foo");
        const url5 = (0, getRefUrl_1.default)(data, "/foo/bar/baz/:slugz/:a/test/:b.a");
        expect(url5).toBe("/foo/bar/baz/foobarbaz/foo/test/nestedslug");
    });
});
//# sourceMappingURL=getRefUrl.test.js.map