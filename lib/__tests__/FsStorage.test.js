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
const FsStorage_1 = __importDefault(require("../media/storage/FsStorage"));
describe("FsStorage", () => {
    let storage;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const uploadDir = path_1.default.join(__dirname, ".uploads");
        storage = new FsStorage_1.default(uploadDir);
    }));
    it("should resolve ids", () => {
        expect(storage.getFile("aaa")).toMatch(/__tests__\/.uploads\/aaa$/);
    });
    it("should reject malformed ids", () => {
        expect(() => storage.getFile("aaa/../../bbb")).toThrowError();
        expect(() => storage.getFile("/aaa")).toThrowError();
    });
});
//# sourceMappingURL=FsStorage.test.js.map