import * as Cotype from "../../../../typings";
import React, { Component } from "react";
import titleCase from "title-case";

import Fields, { FieldLayout } from "../../common/Fields";
import outputs from "./outputs";

type Props = {
  value: any;
  compareTo?: any;
  layout?: FieldLayout;
  fields: Cotype.Fields;
};
export default class ObjectOutput extends Component<Props> {
  static getSummary = (type, props) => {
    const { value, fields } = props;
    if (!value) return null;
    return Object.keys(fields).reduce((summary, key) => {
      if (summary) return summary;
      const f = fields[key];
      const output = outputs.get(f);
      if (output[type] && value[key]) {
        return output[type]({ ...f, value: value[key] });
      }
    }, null);
  };

  static getSummaryImage(props: Props) {
    return ObjectOutput.getSummary("getSummaryImage", props);
  }

  static getSummaryText(props: Props) {
    return ObjectOutput.getSummary("getSummaryText", props);
  }

  render() {
    const { value, compareTo, fields, layout } = this.props;
    return (
      <Fields
        layout={layout}
        fields={
          Object.keys(fields)
            .map(key => {
              const f = fields[key];
              if ("hidden" in f) return null;
              const { type, label = titleCase(key), ...props } = f;
              if (type === "position") {
                return null;
              }
              const FieldComponent = outputs.get(f);
              const element = (
                <FieldComponent
                  {...props}
                  value={(value || {})[key]}
                  compareTo={compareTo && compareTo[key]}
                />
              );
              return { label, element, key };
            })
            .filter(Boolean) as any
        }
      />
    );
  }
}
