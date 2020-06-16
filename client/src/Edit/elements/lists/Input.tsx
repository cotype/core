import * as Cotype from "../../../../../typings";
import React, { Component } from "react";
import { FieldProps } from "formik";
import Inline from "./inline/Input";
import Block from "./block/Input";
import { required } from "../validation";
import inputs from "../inputs";

type Props = FieldProps<any> & Cotype.ListType;

const listNeedsToHaveMoreItems = (listValues: any[], props: Props): boolean => {
  const { minLength } = props;
  return (
    minLength !== undefined &&
    ((props.required || !!(listValues || []).length) &&
      listValues.length < minLength)
  );
};
export const listNeedsToHaveLessItems = (
  listValues: any[],
  props: Props
): boolean => {
  const { maxLength } = props;
  return (
    maxLength !== undefined &&
    (props.required || !!(listValues || []).length) &&
    listValues.length > maxLength
  );
};

class Input extends Component<Props> {
  static validate(value: any, props: Props) {
    const isRequired = required(value ? value.length : value, props);
    if (isRequired) return isRequired;
    const errors: any = [];

    const { minLength, maxLength } = props;

    if (listNeedsToHaveMoreItems(value, props)) {
      return `This list needs to contain at least ${minLength} items${
        props.required ? "" : " when used"
      }.`;
    }

    if (listNeedsToHaveLessItems(value, props)) {
      return `This list must not contain more then ${maxLength} items${
        props.required ? "" : " when used"
      }.`;
    }

    if (value && value.length) {
      value.forEach((item, idx) => {
        const component = inputs.get(props.item);
        const error = component && component.validate(item.value, props.item);
        if (error) errors[idx] = { value: error };
      });

      if (errors.length > 0) return errors;
    }
  }

  render() {
    const { layout = "block" } = this.props;
    if (layout === "inline") return <Inline {...this.props} />;
    return <Block {...this.props} />;
  }
}

export default Input;
