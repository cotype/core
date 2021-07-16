import React, { Component } from "react";

import { outputClass } from "@cotype/ui";
import styled from "styled-components/macro";

const Container = styled("div")`
  ${outputClass}
`;
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
      <Container data-name={dataName}>{value}</Container>
    );
  }
}
