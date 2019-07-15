import TextInput from "../TextInput";
import { FieldProps } from "formik";

describe("TextInput", () => {
  it("should be required with valid input", () => {
    const props = { required: true };
    expect(
      TextInput.validate("www.cellular.de", props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });

  it("should be required with not valid input", () => {
    const props = { required: true };
    expect(
      TextInput.validate("", props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe("This field is required");
  });

  it("should validate input with regex", () => {
    const props = { validationRegex: "W*(http:|https:)W*" };
    expect(
      TextInput.validate("http://www.cellular.de", props as FieldProps<any> & {
        validationRegex?: string;
      })
    ).toBe(undefined);
  });

  it("should validate required input with regex", () => {
    const props = { validationRegex: "W*(http:|https:)W*", required: true };
    expect(
      TextInput.validate("http://www.cellular.de", props as FieldProps<any> & {
        validationRegex?: string;
        required?: boolean;
      })
    ).toBe(undefined);
  });

  it("should validate required empty input with regex", () => {
    const props = { validationRegex: "W*(http:|https:)W*", required: true };
    expect(
      TextInput.validate("", props as FieldProps<any> & {
        validationRegex?: string;
        required?: boolean;
      })
    ).toBe("This field is required");
  });
});
