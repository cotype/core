import React, { Component } from "react";
import { FieldProps } from "formik";
import api from "../../api";
import { required } from "./validation";

type Props = FieldProps<any> & {
  nullLabel?: string;
  fetch?: string;
  values?: string[] | any[];
  required?: boolean;
};
type State = {
  options: any[];
};
export default class OptionsInput extends Component<Props, State> {
  static getDefaultValue(props: Props) {
    return null;
  }

  static validate(value: any, props: Props) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;
  }

  state: State = {
    options: []
  };

  setOptions = opts => {
    const { nullLabel } = this.props;

    const options = opts
      ? opts.map(o => (typeof o === "string" ? { label: o, value: o } : o))
      : [];
    if (nullLabel) {
      options.unshift({ label: nullLabel, value: "" });
    }
    this.setState({ options });
  };

  componentDidMount() {
    const { values, fetch, nullLabel, form, field } = this.props;

    if (fetch) {
      api.get(fetch).then(this.setOptions);
    } else {
      this.setOptions(values);
      if (!nullLabel && !field.value && values && values.length > 0) {
        form.setFieldValue(
          field.name,
          typeof values[0] === "string" ? values[0] : values[0].value
        );
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { nullLabel, values, form, field } = this.props;

    if (!nullLabel && !field.value && values && values !== prevProps.values) {
      form.setFieldValue(field.name, values[0]);
    }
  }

  render() {
    const { field, nullLabel } = this.props;
    const { options } = this.state;
    const { value, ...props } = field;
    const selected = options.find(o => String(o.value) === String(value));
    return (
      <select value={selected ? selected.value : ""} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
}
