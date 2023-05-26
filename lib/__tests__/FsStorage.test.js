"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const FsStorage_1 = __importDefault(require("../media/storage/FsStorage"));
describe("FsStorage", () => {
    let storage;
    beforeAll(async () => {
        const uploadDir = path_1.default.join(__dirname, ".uploads");
        storage = new FsStorage_1.default(uploadDir);
    });
    it("should resolve ids", () => {
        expect(storage.getFile("aaa")).toMatch(/__tests__\/.uploads\/aaa$/);
    });
    it("should reject malformed ids", () => {
        expect(() => storage.getFile("aaa/../../bbb")).toThrowError();
        expect(() => storage.getFile("/aaa")).toThrowError();
    });
});
//# sourceMappingURL=FsStorage.test.js.map