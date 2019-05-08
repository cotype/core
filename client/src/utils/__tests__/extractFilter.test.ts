import { model } from "./modelData";
import extractFilter from "../extractFilter";

describe("extractValues", () => {
  it("should get filterAble Fields", () => {
    expect(extractFilter(model)).toEqual({
      name: { label: undefined, type: "string" },
      immut: { label: undefined, type: "string" },
      slug: { input: "slug", label: undefined, type: "string" },
      "test.field1": { label: undefined, type: "number" },
      "test.field2": { label: undefined, type: "string" },
      "test.field3": { label: undefined, type: "boolean" },
      "test.field4": { label: undefined, type: "list" },
      "test.field5.test": { label: undefined, type: "string" },
      test2: { label: undefined, type: "list" },
      empty: { label: undefined, type: "list" },
      ref: { label: undefined, type: "content", models: ["indexContent"] }
    });
  });
});
