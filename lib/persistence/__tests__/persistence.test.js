"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const __1 = __importDefault(require(".."));
const model_1 = __importDefault(require("../../model"));
const models = (0, model_1.default)([]);
describe("migration", () => {
    it("aaaa", async () => {
        const adapter = {
            settings: {
                find: jest.fn(),
                create: jest.fn()
            },
            content: {
                migrate: jest.fn()
            }
        };
        await (0, __1.default)(models, adapter, {
            migrationDir: path_1.default.join(__dirname, "migrations"),
            basePath: "",
            mediaUrl: "/media"
        });
        expect(adapter.content.migrate).toBeCalledWith([
            expect.objectContaining({ name: "001_first" }),
            expect.objectContaining({ name: "002_second" })
        ], expect.any(Function));
    });
});
//# sourceMappingURL=persistence.test.js.map