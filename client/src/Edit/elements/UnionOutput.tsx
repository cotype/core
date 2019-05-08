import React, { Component, Fragment } from "react";
import ObjectOutput from "./ObjectOutput";
import outputs from "./outputs";
import { TypeLabel } from "./UnionInput";
import titleCase from "title-case";

type Props = {
  value: {
    _type: string;
    [index: string]: any;
  };
  types: {};
};

export default class UnionOutput extends Component<Props> {
  static getSummary = (type, props) => {
    const { value, types } = props;
    if (!value || !value._type) return null;
    const output = outputs.get(types[value._type]);
    if (output && output[type]) {
      return output[type]({ ...types[value._type], value });
    }
    return null;
  };

  static getSummaryImage(props: Props) {
    return UnionOutput.getSummary("getSummaryImage", props);
  }

  static getSummaryText(props: Props) {
    return UnionOutput.getSummary("getSummaryText", props);
  }

  render() {
    const { value, types, ...props } = this.props;
    if (!value) return null;
    const { _type } = value;
    const type = types[_type];
    if (!type) return null;
    const fields = type.fields;
    return (
      <Fragment>
        <TypeLabel style={{ color: "var(--dark-color)" }}>
          {type.label || titleCase(_type)}
        </TypeLabel>
        <ObjectOutput fields={fields} value={value} {...props} />
      </Fragment>
    );
  }
}
