import React, { Component } from "react";
import { FieldProps, getIn } from "formik";
import Quill from "../../common/Quill";
import QuillRef from "quill";
import { required } from "./validation";
import _set from "lodash/set";
import { Media as MediaType, RichtextType } from "../../../../typings";
import RichTextLinkModal from "../RichTextLinkModal";
import Media from "../../Media";
import ModalDialog from "../../common/ModalDialog";

import { mediaBasePath } from "../../basePath";

type Props = FieldProps<any> & RichtextType;
type State = {
  open: boolean;
  openImageModal: boolean;
  text: string;
  link: string;
  subStr: { index: number; length: number };
};

const modalDialogStyle = {
  width: "80vw",
  height: "90vh",
  background: "#f5f5f5",
  maxWidth: 1600
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
        value = ops[0].insert.trim().replace(/↵/g, "");
      }
    }
    const isRequired = required(value, props);
    if (isRequired) return isRequired;
  }
  quillRef: QuillRef | null = null;
  quillRefBox: any | null = null;
  state: State = {
    open: false,
    openImageModal: false,
    text: "",
    link: "",
    subStr: {
      index: 0,
      length: 0
    }
  };
  setQuillToolTips = () => {
    const that = this;
    if (!this.quillRef) {
      return;
    }
    (this.quillRef as any).theme.tooltip.show = function () {
      if (!that.quillRef) {
        return;
      }
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
    if (!this.quillRef) {
      return;
    }
    this.quillRef.deleteText(index, length);
    if (text) {
      this.quillRef.insertText(index, text, "link", link && link);
    }
  };

  openLinkModal = val => {
    if (!this.quillRef) {
      return;
    }
    const range = this.quillRef.getSelection();
    const { index, length } = range || { index: 0, length: 0 };
    const text = this.quillRef.getText();
    this.setState({
      open: true,
      text: text.substr(index, length),
      link: "",
      subStr: { index, length }
    });
  };
  closeLinkModal = () => this.setState({ open: false });
  openImageModal = val => {
    if (!this.quillRef) {
      return;
    }
    this.setState({
      openImageModal: true
    });
  };
  closeImageModal = () => this.setState({ openImageModal: false });
  chooseMedia = ([media]: MediaType[] | string[]) => {
    this.closeImageModal();
    if (!this.quillRef) {
      return;
    }
    const src =
      typeof media === "string" ? media : mediaBasePath + "/media/" + media.id;
    const range = this.quillRef.getSelection();
    const { index } = range || { index: 0 };
    this.quillRef.insertEmbed(index, "image", src);
  };

  render() {
    const { field, formats, modules, linkFormats } = this.props;
    const { open, text, link, openImageModal } = this.state;
    let { value } = field;
    value = value ? value : this.defaultValue;
    return (
      <>
        {open && (
          <RichTextLinkModal
            linkFormats={linkFormats}
            initial={{ text, link }}
            onSave={this.linkHandler}
            onClose={this.closeLinkModal}
          />
        )}
        {openImageModal && (
          <ModalDialog
            onClose={this.closeImageModal}
            title="Gallery"
            style={modalDialogStyle}
          >
            <Media
              openFromInput
              onSelect={this.chooseMedia}
              mediaType={"image"}
            />
          </ModalDialog>
        )}
        <Quill
          key={typeof value === "string" ? "html" : "delta"}
          innerRef={el => {
            if (el) {
              this.quillRefBox = el;
              this.quillRef = el.getEditor();
              this.setQuillToolTips();
            }
          }}
          value={value}
          id={this.props.field.name}
          bounds="#edit-form"
          onChange={this.handleChange}
          theme="snow"
          formats={formats}
          modules={{
            ...(modules || {}),
            toolbar: {
              container: (modules && modules.toolbar) || [],
              handlers: {
                link: this.openLinkModal,
                image: this.openImageModal
              }
            }
          }}
        />
      </>
    );
  }
}
