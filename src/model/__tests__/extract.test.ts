import extractValues from "../extractValues";
import { data, model } from "./modelData";
import extractText from "../extractText";
import extractRefs from "../extractRefs";
import getPositionFields from "../getPositionFields";
import getAlwaysUniqueFields from "../getAlwaysUniqueFields";

describe("extractValues", () => {
  it("should extract correct Values from Data (uniqueFields, PositionField, orderBy Field, TitleField, indexed Fields)", () => {
    expect(extractValues(data, model)).toEqual({
      name: "Test",
      pos: "abc",
      slug: "test",
      immut: "test2",
      "test.pos2": "abcd",
      "test.field1": 3,
      "test.field2": "test3",
      "test.field3": true,
      "test.field4": ["Hallo", "Liste"],
      "test.field5.test": "hallo",
      test2: ["Hallo2", "Liste2"],
      empty: "null",
      contentList: [456, 789]
    });
  });
  it("should extract all text", () => {
    expect(extractText(data, model)).toEqual(
      "Test test test2 3 test3 Hallo Liste hallo Hallo2 Liste2 asd asd ads"
    );
  });
  it("should extract all references", () => {
    expect(extractRefs(data, model, [model])).toEqual([
      { content: 123, optional: true },
      { content: 321, optional: false },
      { content: 456, optional: true },
      { content: 789, optional: true }
    ]);
  });
  it("should get All PositionFields", () => {
    expect(getPositionFields(model)).toEqual(["pos", "test.pos2"]);
  });
  it("should get All UniqueFields (+PositionFields)", () => {
    expect(getAlwaysUniqueFields(model)).toEqual([
      "slug",
      "test.field5.test",
      "pos",
      "test.pos2"
    ]);
  });
});
