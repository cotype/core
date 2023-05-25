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
const extractMatch_1 = __importDefault(require("../extractMatch"));
const modelData_1 = require("./modelData");
const data = {
    name: "Nihil fusce sunt fugit. Consectetuer.",
    slug: "Fugit et arcu eaque? Similique consectetuer ante molestiae, habitasse earum."
};
const expectedResponse = "Similique consectetuer ante molestiae, habitasse earum.";
describe("best matches", () => {
    it("should return match with partial word", () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield (0, extractMatch_1.default)(data, modelData_1.model, "consec")).toBe(expectedResponse);
    }));
    it("should return match with full word", () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield (0, extractMatch_1.default)(data, modelData_1.model, "consectetuer")).toBe(expectedResponse);
    }));
    it("should return match with partial and full word", () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield (0, extractMatch_1.default)(data, modelData_1.model, "consectetuer an")).toBe(expectedResponse);
    }));
});
//# sourceMappingURL=extractMatch.test.js.map