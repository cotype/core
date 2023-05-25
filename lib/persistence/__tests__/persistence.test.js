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
const __1 = __importDefault(require(".."));
const model_1 = __importDefault(require("../../model"));
const models = (0, model_1.default)([]);
describe("migration", () => {
    it("aaaa", () => __awaiter(void 0, void 0, void 0, function* () {
        const adapter = {
            settings: {
                find: jest.fn(),
                create: jest.fn()
            },
            content: {
                migrate: jest.fn()
            }
        };
        yield (0, __1.default)(models, adapter, {
            migrationDir: path_1.default.join(__dirname, "migrations"),
            basePath: "",
            mediaUrl: "/media"
        });
        expect(adapter.content.migrate).toBeCalledWith([
            expect.objectContaining({ name: "001_first" }),
            expect.objectContaining({ name: "002_second" })
        ], expect.any(Function));
    }));
});
//# sourceMappingURL=persistence.test.js.map