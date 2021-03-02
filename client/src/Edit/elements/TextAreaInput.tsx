import React, { Component } from "react";
import { FieldProps } from "formik";
import { inputClass } from "@cotype/ui";
import { required as validateRequired } from "./validation";
import Textarea from "react-textarea-autosize";
import styled from "styled-components/macro";

const StyledTextarea = styled(Textarea)`
  ${inputClass}
`;
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

  static validate(value: any = "", props: Props) {
    const isRequired = validateRequired(value, props);
    if (isRequired) return isRequired;
    if (props.minLength && value.length < props.minLength) {
      return "Text is too short";
    }
    if (props.maxLength && value.length > props.maxLength) {
      return "Text is too long";
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
      <StyledTextarea
        readOnly={readOnly}
        minLength={minLength}
        maxLength={maxLength}
        maxRows={maxRows}
        minRows={minRows}
        value={value || ""}
        {...props}
      />
    );
  }
}
