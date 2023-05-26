"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extractMatch_1 = __importDefault(require("../extractMatch"));
const modelData_1 = require("./modelData");
const data = {
    name: "Nihil fusce sunt fugit. Consectetuer.",
    slug: "Fugit et arcu eaque? Similique consectetuer ante molestiae, habitasse earum."
};
const expectedResponse = "Similique consectetuer ante molestiae, habitasse earum.";
describe("best matches", () => {
    it("should return match with partial word", async () => {
        expect(await (0, extractMatch_1.default)(data, modelData_1.model, "consec")).toBe(expectedResponse);
    });
    it("should return match with full word", async () => {
        expect(await (0, extractMatch_1.default)(data, modelData_1.model, "consectetuer")).toBe(expectedResponse);
    });
    it("should return match with partial and full word", async () => {
        expect(await (0, extractMatch_1.default)(data, modelData_1.model, "consectetuer an")).toBe(expectedResponse);
    });
});
//# sourceMappingURL=extractMatch.test.js.map