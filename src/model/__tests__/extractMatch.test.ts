import extractMatch from "../extractMatch";
import { model } from "./modelData";

const data = {
  name: "Nihil fusce sunt fugit. Consectetuer.",
  slug:
    "Fugit et arcu eaque? Similique consectetuer ante molestiae, habitasse earum."
};

const expectedResponse =
  "Similique consectetuer ante molestiae, habitasse earum.";
describe("best matches", () => {
  it("should return match with partial word", async () => {
    expect(await extractMatch(data, model, "consec")).toBe(expectedResponse);
  });
  it("should return match with full word", async () => {
    expect(await extractMatch(data, model, "consectetuer")).toBe(
      expectedResponse
    );
  });
  it("should return match with partial and full word", async () => {
    expect(await extractMatch(data, model, "consectetuer an")).toBe(
      expectedResponse
    );
  });
});
