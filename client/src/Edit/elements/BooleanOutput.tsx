import React, { Component } from "react";
import ToggleSwitch from "../../common/ToggleSwitch";

type Props = {
  value: any;
  input?: "checkbox" | "toggle";
};
export default class BooleanOutput extends Component<Props> {
  render() {
    const { value, input } = this.props;
    if (input === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={value}
        />
      );
    }
    return (
      <ToggleSwitch
        on={value}
        disabled
      />
    );
  }
}

