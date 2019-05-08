import React, { Component } from "react";
import { Formik, FormikActions, FormikProps } from "formik";
import { Cols, Content } from "../common/page";
import { Input } from "./elements";
import Button from "../common/Button";
import ModalDialog from "../common/ModalDialog";
import { paths } from "../common/icons";

export const errorClass = "error-field-label";

type Props = {
  onSave: (text: string, link: string | false) => void;
  onClose: () => void;
  initial: { text: string; link: string };
};

const modalDialogStyle = {
  width: "80vw",
  background: "#f5f5f5",
  maxWidth: 800
};
class RichTextLinkModal extends Component<Props> {
  onSubmit = (
    values: any,
    { setSubmitting, setFieldError }: FormikActions<any>
  ) => {
    if (!values.link) {
      return this.props.onSave(values.text, false);
    }
    let link = values.link.id;
    if (values.link.model) {
      link = "$intern:" + values.link.model + ":" + values.link.id + "$";
    }
    this.props.onSave(values.text.trim(), link);
  };

  render() {
    const model: any = {
      link: {
        label: "Link",
        type: "content",
        models: [],
        allowAbsoluteRefs: true
      },
      text: {
        label: "Text",
        type: "string"
      }
    };
    const { initial } = this.props;
    const link: { model: string | undefined; id: string | number } = {
      model: undefined,
      id: initial.link
    };
    const match = /\$intern:([\w]*):([0-9]*)\$/gm.exec(initial.link);

    if (match) {
      link.model = match[1];
      link.id = match[2];
    }

    const initalValues = {
      text: initial.text,
      link
    };
    return (
      <Formik
        initialValues={initalValues}
        validateOnChange={false}
        validateOnBlur={false}
        enableReinitialize
        onSubmit={this.onSubmit}
        render={(form: FormikProps<any>) => {
          const { handleSubmit } = form as any;

          const actions = [
            <Button icon={paths.Save} onClick={handleSubmit}>
              save
            </Button>,
            <Button icon={paths.Clear} onClick={this.props.onClose} light>
              cancel
            </Button>
          ];
          return (
            <ModalDialog
              onClose={this.props.onClose}
              title="set link"
              icon={paths.Link}
              actionButtons={actions}
              style={modalDialogStyle}
            >
              <form onSubmit={handleSubmit}>
                <Cols>
                  <Content style={{ padding: 0 }}>
                    <Input key={"linkModal"} fields={model} form={form} />
                  </Content>
                </Cols>
              </form>
            </ModalDialog>
          );
        }}
      />
    );
  }
}

export default RichTextLinkModal;
