import React, { Component } from "react";
import { FieldProps } from "formik";
import ToggleSwitch from "../../common/ToggleSwitch";

type Props = FieldProps<any> & {
  input?: "checkbox" | "toggle";
  defaultValue?: boolean;
};

export default class BooleanInput extends Component<Props> {
  static getDefaultValue({ defaultValue = false }: Props) {
    return defaultValue;
  }

  static validate() {
    /* noop */
  }

  render() {
    const { field, form, input } = this.props;
    const { name, value } = field;
    if (input === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={value}
          onChange={e => form.setFieldValue(name, e.target.checked)}
        />
      );
    }
    return (
      <ToggleSwitch
        on={value}
        onClick={() => form.setFieldValue(name, !value)}
      />
    );
  }
}
