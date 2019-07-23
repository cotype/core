import React, { Component } from "react";
import { FieldProps } from "formik";
import { inputClass } from "../../common/styles";
import { required as validateRequired } from "./validation";
import Textarea from "react-textarea-autosize";

type Props = FieldProps<any> & {
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  minLength?: number;
  minRows?: number;
  maxRows?: number;
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

  static validate(value: any, props: Props) {
    const isRequired = validateRequired(value, props);
    if (isRequired) return isRequired;

    if (props.minLength && value.length < props.minLength) {
      return "Text is to short";
    }
    if (props.maxLength && value.length > props.maxLength) {
      return "Text is to long";
    }
  }

  render() {
    const {
      field,
      maxLength,
      minLength,
      minRows = 4,
      maxRows,
      readOnly
    } = this.props;
    const { value, ...props } = field;
    return (
      <Textarea
        readOnly={readOnly}
        minLength={minLength}
        maxLength={maxLength}
        maxRows={maxRows}
        minRows={minRows}
        className={inputClass}
        value={value || ""}
        {...props}
      />
    );
  }
}
