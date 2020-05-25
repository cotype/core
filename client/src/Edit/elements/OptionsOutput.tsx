import React, { Component } from "react";

type Props = {
  value: string | { label: string; value: string };
};
export default class OptionsOutput extends Component<Props> {
  render() {
    const { value } = this.props;
    return (
      <select disabled>
        <option value={typeof value === "string" ? value : value.value}>{typeof value === "string" ? value : value.label}</option>)
      </select>
    );
  }
}
