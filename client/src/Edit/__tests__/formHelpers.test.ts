import { hasActuallyErrors } from "../formHelpers";

describe("formHelpers", () => {
  it("Error Object has actually Errors", () => {
    expect(
      hasActuallyErrors([{ values: { foo: ["Foo Error"], bar: "Bar Error" } }])
    ).toBe(true);
    expect(hasActuallyErrors("Error")).toBe(true);
  });

  it("Error Object no actual Errors", () => {
    expect(hasActuallyErrors([{ values: { foo: [] } }])).toBe(false);
    expect(hasActuallyErrors(undefined)).toBe(false);
  });
});
