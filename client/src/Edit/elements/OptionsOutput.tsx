import React, { Component } from "react";

type Props = {
  value: any;
};
export default class OptionsOutput extends Component<Props> {
  render() {
    const { value } = this.props;
    return (
      <select disabled>
        <option>{value}</option>)
      </select>
    );
  }
}
