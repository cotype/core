import React, { Component } from "react";
import Quill from "../../common/Quill";
import { DeltaOperation } from "quill";
import Delta from "quill-delta";

type Ops = {
  ops: DeltaOperation[];
};

function createDiff(oldContent: Ops, newContent: Ops) {
  const oldDelta = new Delta(oldContent);
  const newDelta = new Delta(newContent);
  const diff = oldDelta.diff(newDelta);
  diff.ops.forEach(op => {
    // if the change was an insertion
    if (op.insert) {
      // color it green
      op.attributes = {
        background: "#cce8cc",
        color: "#003700"
      };
    }
    // if the change was a deletion
    else if (op.delete) {
      // keep the text
      op.retain = op.delete;
      delete op.delete;
      // but color it red and struckthrough
      op.attributes = {
        background: "#e8cccc",
        color: "#370000",
        strike: true
      };
    }
    // if attributes were changed
    else if (op.retain && op.attributes) {
      op.attributes = {
        ...op.attributes,
        background: "#e8e5cd"
      };
    }
  });
  return oldDelta.compose(diff);
}

type Props = {
  value: Ops;
  compareTo: Ops | undefined;
};
export default class RichTextOutput extends Component<Props> {
  static getSummaryText(props: Props) {
    return <RichTextOutput {...props} />;
  }

  render() {
    const { value, compareTo } = this.props;
    const delta = compareTo ? createDiff(compareTo, value) : value;

    return <Quill value={delta || ""} readOnly theme={null} />;
  }
}
