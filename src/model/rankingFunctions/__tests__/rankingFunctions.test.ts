import dummyText from "./text";
import bm25BestMatch from "../bm25";
import ratcliffObershelpBestMatch from "../ratcliffObershelp";

const getSentences = (text: string) => {
  const sentences: string[] = [];
  const s = text.replace(/[\n\s]+/g, " ");
  const re = /[^.?!]+.?/g;
  let m;
  do {
    m = re.exec(s);
    if (m) sentences.push(m[0].trim());
  } while (m);
  return sentences;
};

describe("find a matching sentence for a query", () => {
  let sentences: string[];
  const expectedStrictBestMatch = "yes, Joey just loves being in his playpen.";
  const expectedLooseBestMatch = "Are those my clocks I hear?";
  beforeAll(() => {
    sentences = getSentences(dummyText);
  });
  describe("bm25", () => {
    it("should find a matches", async () => {
      const bestMatches = bm25BestMatch(sentences, "playpen");
      expect(bestMatches[0]).toBe(expectedStrictBestMatch);
    });
  });
  describe("ratcliff Obershelp", () => {
    it("should find a matches in strictMode", async () => {
      const bestMatches = ratcliffObershelpBestMatch(sentences, "plaype", true);
      expect(bestMatches[0]).toBe(expectedStrictBestMatch);
    });
    it("should find a matches in loose mode", async () => {
      const bestMatches = ratcliffObershelpBestMatch(
        sentences,
        "save the clock",
        false
      );
      expect(bestMatches[0]).toBe(expectedLooseBestMatch);
    });
  });
});
