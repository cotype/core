import React, { Component } from "react";
import { FieldProps } from "formik";
import { inputClass } from "../../common/styles";
import { required as validateRequired } from "./validation";

type Props = FieldProps<any> & {
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
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
    const { field, maxLength, readOnly } = this.props;
    const { value, ...props } = field;
    return (
      <input
        readOnly={readOnly}
        className={inputClass}
        value={value || ""}
        maxLength={maxLength}
        {...props}
      />
    );
  }
}
