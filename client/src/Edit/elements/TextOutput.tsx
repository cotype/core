import React, { Component } from "react";
import { outputClass } from "../../common/styles";

type Props = {
  value?: any;
  "data-name"?: string;
};

export default class TextOutput extends Component<Props> {
  static getSummaryText(props: Props) {
    return <TextOutput {...props} />;
  }

  render() {
    // eslint-disable-next-line
    const { value = "", ["data-name"]: dataName } = this.props;

    return (
      // eslint-disable-next-line
      <div data-name={dataName} className={outputClass}>
        {value}
      </div>
    );
  }
}
