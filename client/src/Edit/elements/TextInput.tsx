import React, { Component } from "react";
import { FieldProps } from "formik";
import { required as validateRequired } from "./validation";
import { Input } from "../../common/styles";

type Props = FieldProps<any> & {
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  minLength?: number;
  validationRegex?: string;
  regexError?: string;
  placeholder?: string;
};
export default class TextInput extends Component<Props> {
  static getDefaultValue(props: Props) {
    return "";
  }

  static getHint(model) {
    const { maxLength, minLength } = model;
    if (maxLength || minLength) {
      return ` (${minLength ? `min. ${minLength}` : ""}${
        minLength && maxLength ? "/" : ""
      }${maxLength ? `max. ${maxLength}` : ""} Zeichen)`;
    }
  }

  static validate(value: any = "", props: Props) {
    const isRequired = validateRequired(value, props);
    if (isRequired) return isRequired;
    if (props.minLength && value.length < props.minLength) {
      return "Text is too short";
    }
    if (props.maxLength && value.length > props.maxLength) {
      return "Text is too long";
    }
    if (props.validationRegex) {
      const check = value.match(props.validationRegex);
      if (!check) {
        return props.regexError ? props.regexError : "not valid";
      }
    }
  }

  render() {
    const { field, maxLength, readOnly, placeholder, minLength } = this.props;
    const { value, ...props } = field;
    return (
      <Input
        readOnly={readOnly}
        value={value || ""}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder}
        {...props}
      />
    );
  }
}
