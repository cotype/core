import React, { Component, Ref } from "react";
import { FieldProps, getIn } from "formik";
import Quill from "../../common/Quill";
import { required } from "./validation";
import _set from "lodash/set";
import { RichtextType } from "../../../../typings";
import RichTextLinkModal from "../RichTextLinkModal";

type Props = FieldProps<any> & RichtextType;
type State = {
  open: boolean;
  text: string;
  link: string;
  subStr: { index: number; length: number };
};

export default class RichTextInput extends Component<Props> {
  static getDefaultValue(props: Props) {
    return { ops: [] };
  }

  static validate(v: any, props: Props) {
    let value = "";

    if (typeof v === "object") {
      const { ops } = v;
      if (ops && ops.length === 0) {
        value = "";
      } else if (ops && ops.length > 0 && ops[0] && ops[0].insert) {
        value = ops[0].insert.trim().replace(/\↵/g, "");
      }
    }
    const isRequired = required(value, props);
    if (isRequired) return isRequired;
  }
  quillRef: any | null = null;
  state: State = {
    open: false,
    text: "",
    link: "",
    subStr: {
      index: 0,
      length: 0
    }
  };
  setQuillToolTips = () => {
    const that = this;
    this.quillRef.theme.tooltip.show = function() {
      const value = that.quillRef.getText(
        this.linkRange.index,
        this.linkRange.length
      );
      const { link } = that.quillRef.getFormat(
        this.linkRange.index,
        this.linkRange.length
      );
      if (!link) {
        return;
      }
      that.setState({
        open: true,
        link,
        text: value,
        subStr: { index: this.linkRange.index, length: this.linkRange.length }
      });
    };
  };
  handleChange = (value, delta, source, editor) => {
    const { field, form } = this.props;
    const { ops } = editor.getContents();
    const initialValue = getIn(form.initialValues, field.name);
    if (typeof initialValue === "string") {
      _set(form.initialValues, field.name, { ops });
    }
    form.setFieldValue(field.name, { ops });
  };

  get defaultValue() {
    return RichTextInput.getDefaultValue(this.props);
  }

  linkHandler = (text, link) => {
    this.setState({
      open: false,
      selection: ""
    });
    const { index, length } = this.state.subStr;
    this.quillRef.deleteText(index, length);
    if (text) {
      this.quillRef.insertText(index, text, "link", link && link);
    }
  };

  openLinkModal = val => {
    if (!this.quillRef) {
      return;
    }
    const { index, length } = this.quillRef.getSelection();
    const text = this.quillRef.getText();
    this.setState({
      open: true,
      text: text.substr(index, length),
      link: "",
      subStr: { index, length }
    });
  };
  closeLinkModal = () => this.setState({ open: false });

  render() {
    const { field, formats, modules } = this.props;
    const { open, text, link } = this.state;
    let { value } = field;
    value = value ? value : this.defaultValue;

    return (
      <>
        {open && (
          <RichTextLinkModal
            initial={{ text, link }}
            onSave={this.linkHandler}
            onClose={this.closeLinkModal}
          />
        )}
        <Quill
          key={typeof value === "string" ? "html" : "delta"}
          innerRef={el => {
            if (el) {
              this.quillRef = el.getEditor();
              this.setQuillToolTips();
            }
          }}
          value={value}
          bounds="#edit-form"
          onChange={this.handleChange}
          theme="snow"
          formats={formats}
          modules={{
            ...(modules || {}),
            toolbar: {
              container: (modules && modules.toolbar) || [],
              handlers: {
                link: this.openLinkModal
              }
            }
          }}
        />
      </>
    );
  }
}
