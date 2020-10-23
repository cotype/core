import React, { Component } from "react";
import { FieldProps } from "formik";
import "rc-input-number/assets/index.css";
import NumericInput from "rc-input-number";
import styled from "styled-components/macro";
import { required } from "./validation";

const StyledNumericInput = styled(NumericInput)`
  border-radius: 0;
  border: 1px solid #f0f0f0;
  font-size: inherit;
  outline: none;
  height: 100%;
  position: relative;
  :focus,
  :active {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px var(--semi-transparent-accent-color);
  }
  & .rc-input-number-input-wrap {
    box-sizing: border-box;
    transition: box-shadow 0.1s ease, width 0.1s ease;
    color: var(--dark-color);
  }
  & .rc-input-number-handler-wrap {
    position: absolute;
    right: 0;
    top: 0;
  }
  & .rc-input-number-input {
    padding: 10px;
    font-size: inherit;
    text-align: left;
    color: var(--dark-color);
    line-height: normal;
    height: unset;
  }
  & .rc-input-number-handler {
    height: 50%;
    line-height: 16px;
    background-color: var(--disabled-color);
  }

  & .rc-input-number-handler-up-inner::after,
  .rc-input-number-handler-down-inner::after {
    color: var(--dark-color);
  }
`;

type Props = FieldProps<any> & {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  placeholder?: string;
  required?: boolean;
};
export default class Number extends Component<Props> {
  static getDefaultValue(props: Props) {
    return undefined;
  }

  static validate(value: any, props: Props) {
    const isRequired = required(value, props);

    if (value !== 0 && isRequired) return isRequired;
  }

  static getHint(model) {
    const { min, max } = model;
    if (min || max) {
      return `( ${min ? `min: ${min} ` : ""}
      ${max ? `max: ${max}` : ""})`;
    }
  }

  handleChange = (value: number) => {
    const { field, form } = this.props;
    form.setFieldValue(field.name, value);
  };

  render() {
    const { field, min, max, step, precision, placeholder } = this.props;
    const { value } = field;

    return (
      <StyledNumericInput
        onChange={this.handleChange}
        value={value}
        min={min}
        max={max}
        step={step ? step : undefined}
        precision={precision ? precision : 0}
        placeholder={placeholder ? placeholder : undefined}
      />
    );
  }
}
