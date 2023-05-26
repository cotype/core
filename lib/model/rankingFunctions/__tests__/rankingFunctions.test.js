"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_1 = __importDefault(require("./text"));
const bm25_1 = __importDefault(require("../bm25"));
const ratcliffObershelp_1 = __importDefault(require("../ratcliffObershelp"));
const getSentences = (text) => {
    const sentences = [];
    const s = text.replace(/[\n\s]+/g, " ");
    const re = /[^.?!]+.?/g;
    let m;
    do {
        m = re.exec(s);
        if (m)
            sentences.push(m[0].trim());
    } while (m);
    return sentences;
};
describe("find a matching sentence for a query", () => {
    let sentences;
    const expectedStrictBestMatch = "yes, Joey just loves being in his playpen.";
    const expectedLooseBestMatch = "Are those my clocks I hear?";
    beforeAll(() => {
        sentences = getSentences(text_1.default);
    });
    describe("bm25", () => {
        it("should find a matches", async () => {
            const bestMatches = (0, bm25_1.default)(sentences, "playpen");
            expect(bestMatches[0]).toBe(expectedStrictBestMatch);
        });
    });
    describe("ratcliff Obershelp", () => {
        it("should find a matches in strictMode", async () => {
            const bestMatches = (0, ratcliffObershelp_1.default)(sentences, "plaype", true);
            expect(bestMatches[0]).toBe(expectedStrictBestMatch);
        });
        it("should find a matches in loose mode", async () => {
            const bestMatches = (0, ratcliffObershelp_1.default)(sentences, "save the clock", false);
            expect(bestMatches[0]).toBe(expectedLooseBestMatch);
        });
    });
});
//# sourceMappingURL=rankingFunctions.test.js.map