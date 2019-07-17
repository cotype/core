jest.mock("../../../common/Autocomplete", () => null);

import ReferenceInput from "../ReferenceInput";
import { FieldProps } from "formik";

describe("TextInput", () => {
  it("should be required with valid input", () => {
    const props = { required: true };
    expect(
      ReferenceInput.validate(
        { id: "http://www.cellular.de" },
        props as FieldProps<any> & {
          required?: boolean;
        }
      )
    ).toBe(undefined);
  });

  it("should be required with not valid input", () => {
    const props = { required: true };
    expect(
      ReferenceInput.validate({ id: "" }, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe("This field is required");
  });

  it("should validate input with regex", () => {
    expect(ReferenceInput.validate({ id: "http://www.cellular.de" }, {})).toBe(
      undefined
    );
  });

  it("should validate required input with regex", () => {
    const props = {
      required: true
    };
    expect(
      ReferenceInput.validate(
        { id: "http://www.cellular.de" },
        props as FieldProps<any> & {
          required?: boolean;
        }
      )
    ).toBe(undefined);
  });

  it("should validate required empty input with regex", () => {
    const props = {
      required: true
    };
    expect(
      ReferenceInput.validate({ id: "" }, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe("This field is required");
  });

  it("should validate required not valid input with regex", () => {
    const props = {
      required: true
    };
    expect(
      ReferenceInput.validate({ id: "ff/" }, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(
      'This url is not valid. Links to the same domain need to start with "/" or to other domains with a valid protocol (http/https).'
    );
  });

  it("should validate internal input with regex", () => {
    const props = {
      required: true
    };
    expect(
      ReferenceInput.validate({ id: "/path/to" }, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });
});
