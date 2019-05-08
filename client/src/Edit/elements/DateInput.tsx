import React, { Component } from "react";
import moment from "moment";
import { FieldProps } from "formik";
import "moment/locale/de";
import dateJS from "date.js";
import DatePicker from "../../common/DatePicker";
import { required } from "./validation";
import { DateString } from "../../../../typings";

type Props = FieldProps<any> & DateString;
export default class DateInput extends Component<Props> {
  static getDefaultValue(props: Props) {
    const { defaultValue } = props;
    return defaultValue ? dateJS(defaultValue) : "";
  }

  static validate(value: string, props) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;

    if (value === undefined || value === "") return;
    const date = moment(value).isValid();
    if (!date) {
      return "Invalid date";
    }
  }

  handleChange = (value: string) => {
    const { field, form } = this.props;
    form.setFieldValue(field.name, value);
  };

  render() {
    const { field, placeholder } = this.props;
    return (
      <DatePicker
        {...field}
        onChange={this.handleChange}
        placeholder={placeholder}
      />
    );
  }
}
