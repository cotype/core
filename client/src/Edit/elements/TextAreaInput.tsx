import React, { Component } from "react";
import { FieldProps } from "formik";
import { inputClass } from "../../common/styles";
import { required as validateRequired } from "./validation";
import Textarea from "react-textarea-autosize";

type Props = FieldProps<any> & { required?: boolean; maxLength?: number };
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
    const { field, form, required, maxLength, ...props } = this.props;
    const { value, ...fieldProps } = field;
    return (
      <Textarea
        minRows={4}
        className={inputClass}
        value={value || ""}
        maxLength={maxLength}
        {...fieldProps}
        {...props}
      />
    );
  }
}
