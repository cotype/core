jest.mock("../../../common/Autocomplete", () => null);

import ReferenceInput from "../ReferenceInput";
import { FieldProps } from "formik";

describe("ReferenceInput", () => {
  it("should be required with with no valid ref", () => {
    const props = { required: true };
    const ref = { id: "", model: null };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe("This field is required");
  });

  it("should be required with valid external ref", () => {
    const props = { required: true };
    const ref = { id: "http://www.cellular.de", model: null };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });

  it("should be required with valid internal ref", () => {
    const props = { required: true };
    const ref = { id: "/path/to/something", model: "contact" };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });

  it("should be not required with no input and no model", () => {
    const props = { required: false };
    const ref = { id: "", model: null };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });

  it("should be not required with valid mail address", () => {
    const props = { required: false };
    const ref = { id: "mailto:test@cellular.de", model: null };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });
  it("should be not required with valid phone number", () => {
    const props = { required: false };
    const ref = { id: "tel:+491234567890", model: null };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });
  it("should be not required with valid external ref", () => {
    const props = { required: false };
    const ref = { id: "http://www.cellular.de", model: null };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });

  it("should be not required with no valid external ref", () => {
    const props = { required: false };
    const ref = { id: "www.cellular.de", model: null };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(
      'This url is not valid. Links to the same domain need to start with "/", to other domains with a valid protocol (http/https) or with a valid contact protocol (mailto/tel).'
    );
  });

  it("should be not required with valid internal ref", () => {
    const props = { required: false };
    const ref = { id: "/path/to/something", model: "contact" };
    expect(
      ReferenceInput.validate(ref, props as FieldProps<any> & {
        required?: boolean;
      })
    ).toBe(undefined);
  });
});
