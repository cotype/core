import React, { Component } from "react";
import { FieldProps } from "formik";
import { inputClass } from "../../common/styles";
import { required as validateRequired } from "./validation";
import Textarea from "react-textarea-autosize";

type Props = FieldProps<any> & {
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
};
export default class TextInput extends Component<Props> {
  static getDefaultValue(props: Props) {
    return "";
  }

  static getHint(model) {
    const { maxLength } = model;
    if (maxLength) {
      return ` (max. ${maxLength} Zeichen)`;
    }
  }

  static validate(value: any, props: Props) {
    const isRequired = validateRequired(value, props);
    if (isRequired) return isRequired;
  }

  render() {
    const { field, maxLength, minRows = 4, maxRows, readOnly } = this.props;
    const { value, ...props } = field;
    return (
      <Textarea
        readOnly={readOnly}
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
