import * as Cotype from "../../../../../typings";
import React, { Component } from "react";
import Inline from "./inline/Output";
import Block from "./block/Output";
import outputs from "../outputs";

type Props = Cotype.ListType & {
  value: any[];
  item: Cotype.Type;
  sortable: boolean;
};

export default class Output extends Component<Props> {
  static getSummary = (type, props) => {
    const { value, item: itemType } = props;
    const getSummary = outputs.get(itemType)[type];

    if (!value || !getSummary) return null;
    return value.reduce((summary, item) => {
      if (summary) return summary;
      return getSummary({ ...itemType, value: item.value });
    }, null);
  };

  static getSummaryImage(props: Props) {
    return Output.getSummary("getSummaryImage", props);
  }

  static getSummaryText(props: Props) {
    return Output.getSummary("getSummaryText", props);
  }

  render() {
    const { layout = "block" } = this.props;
    if (layout === "inline") return <Inline {...this.props} />;
    return <Block {...this.props} />;
  }
}
