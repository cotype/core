import extractValues from "../extractValues";
import { data, model } from "./modelData";
import extractText from "../extractText";
import extractRefs from "../extractRefs";
import getPositionFields from "../getPositionFields";
import getAlwaysUniqueFields from "../getAlwaysUniqueFields";

describe("extractValues", () => {
  it("should extract correct Values from Data (uniqueFields, PositionField, orderBy Field, TitleField, indexed Fields)", () => {
    expect(extractValues(data, model)).toEqual({
      name: [{ lang: undefined, v: "Test" }],
      pos: [{ lang: undefined, v: "abc" }],
      slug: [{ lang: undefined, v: "test" }],
      immut: [{ lang: undefined, v: "test2" }],
      "test.pos2": [{ lang: undefined, v: "abcd" }],
      "test.field1": [{ lang: undefined, v: 3 }],
      "test.field2": [{ lang: undefined, v: "test3" }],
      "test.field3": [{ lang: undefined, v: true }],
      "test.field4": [
        { lang: undefined, v: "Hallo" },
        { lang: undefined, v: "Liste" }
      ],
      "test.field5.test": [{ lang: undefined, v: "hallo" }],
      test2: [
        { lang: undefined, v: "Hallo2" },
        { lang: undefined, v: "Liste2" }
      ],
      empty: [{ lang: undefined, v: "null" }],
      contentList: [
        { lang: undefined, v: 456 },
        { lang: undefined, v: 789 },
        { lang: undefined, v: 123 }
      ]
    });
  });
  it("should extract all text", () => {
    expect(extractText(data, model)).toEqual(
      "Test test test2 3 test3 Hallo Liste hallo Hallo2 Liste2 asd asd ads"
    );
  });
  it("should extract all references", () => {
    expect(extractRefs(data, model, [model])).toEqual([
      { content: 123, optional: true, fieldNames: "ref~contentList" },
      { content: 321, optional: false, fieldNames: 'richText' },
      { content: 456, optional: true, fieldNames: "contentList" },
      { content: 789, optional: true, fieldNames: "contentList" }
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
