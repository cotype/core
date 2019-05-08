import React, { Component } from "react";
import { outputClass } from "../../common/styles";
import moment from "moment";
import "moment/locale/de";

const FORMAT = "L";

type Props = {
  value?: any;
};
export default class DateOutput extends Component<Props> {
  formatDate = (date: string) => {
    return date ? moment(date).format(FORMAT) : "";
  };
  render() {
    const { value = "" } = this.props;
    return <div className={outputClass}>{this.formatDate(value)}</div>;
  }
}
