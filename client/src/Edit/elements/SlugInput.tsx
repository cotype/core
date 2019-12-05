import React, { Component } from "react";
import { FieldProps } from "formik";
import { slugify } from "../../utils/helper";
import { Input } from "../../common/styles";
import { required } from "./validation";

type Props = FieldProps<any> & { required?: boolean };
export default class SlugInput extends Component<Props> {
  static getDefaultValue(props: Props) {
    return "";
  }

  static validate(value: string, props: object) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;
  }

  handleChange = (e: any) => {
    const { field, form } = this.props;
    form.setFieldValue(field.name, slugify(e.target.value));
  };

  render() {
    const { field } = this.props;
    const { value = "", ...props } = field;
    return (
      <Input value={value || ""} {...props} onChange={this.handleChange} />
    );
  }
}
