import React, { Component } from "react";

import { outputClass } from "@cotype/ui";
import moment from "moment";
import "moment/locale/de";
import styled from "styled-components/macro";

const FORMAT = "L";

type Props = {
  value?: any;
};

const Container = styled("div")`
  ${outputClass}
`;
export default class DateOutput extends Component<Props> {
  formatDate = (date: string) => {
    return date ? moment(date).format(FORMAT) : "";
  };
  render() {
    const { value = "" } = this.props;
    return <Container>{this.formatDate(value)}</Container>;
  }
}
