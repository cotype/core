import React, { Component } from "react";
import { Formik, FormikActions, FormikProps } from "formik";
import { Cols, Content } from "../common/page";
import { Input } from "./elements";
import Button from "../common/Button";
import ModalDialog from "../common/ModalDialog";
import { paths } from "../common/icons";
import { Fields } from "../../../typings";
import { parse } from "qs";

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
    if (!values.link || values.link.length === 0) {
      return this.props.onSave(values.text, false);
    }

    if (values.link[0].value._type === "link" && values.link[0].value.link) {
      let link = values.link[0].value.link.id;
      if (values.link[0].value.link.model) {
        link =
          "$intern:" +
          values.link[0].value.link.model +
          ":" +
          values.link[0].value.link.id +
          "$";
      }
      this.props.onSave(values.text.trim(), link);
    }

    if (values.link[0].value._type === "media" && values.link[0].value.media) {
      const link = "$media:" + values.link[0].value.media + "$";
      this.props.onSave(values.text.trim(), link);
    }
    if (values.link[0].value._type === "mail" && values.link[0].value.email) {
      const subject =
        values.link[0].value.subject && values.link[0].value.subject.length > 0
          ? values.link[0].value.subject
          : null;
      const link =
        "mailto:" +
        values.link[0].value.email +
        (subject ? `?subject=${subject}` : "");
      this.props.onSave(values.text.trim(), link);
    }
  };

  render() {
    const model: Fields = {
      link: {
        label: "Verlinkung",
        type: "list",
        minLength: 0,
        maxLength: 1,
        item: {
          type: "union",
          types: {
            link: {
              type: "object",
              label: "Link",
              fields: {
                link: {
                  type: "content",
                  models: [],
                  label: "Link",
                  allowAbsoluteRefs: true,
                  required: true
                }
              }
            },
            media: {
              type: "object",
              label: "Media",
              fields: {
                media: {
                  type: "media",
                  label: "Media",
                  required: true
                }
              }
            },
            mail: {
              type: "object",
              label: "E-Mail",
              fields: {
                email: {
                  type: "string",
                  label: "E-Mail Adresse",
                  required: true,
                  validationRegex:
                    '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$',
                  regexError: "Has to be a valid e-mail address"
                },
                subject: {
                  type: "string",
                  label: "Betreff"
                }
              }
            }
          }
        }
      },
      text: {
        label: "Text",
        type: "string"
      }
    };
    const { initial } = this.props;
    const link: any = initial.link
      ? {
          key: 0,
          value: {
            _type: "link",
            link: {
              model: undefined,
              id: initial.link
            }
          }
        }
      : {};

    const match = /\$intern:([\w]*):([0-9]*)\$/gm.exec(initial.link);

    if (match) {
      link.value = {
        _type: "link",
        link: {
          model: match[1],
          id: match[2]
        }
      };
    }
    const mediaMatch = /\$media:([\w/.]*)\$/gm.exec(initial.link);

    if (mediaMatch) {
      link.value = {
        _type: "media",
        media: mediaMatch[1],
        link: undefined
      };
    }
    /* eslint-disable-next-line */
    const mailMatch = /mailto:((([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))/gm.exec(
      initial.link
    );

    if (mailMatch) {
      const more = initial.link.split("?");
      let params: { subject?: string } = {};
      if (more[1]) {
        params = parse(more[1]);
      }
      link.value = {
        _type: "mail",
        email: mailMatch[1],
        subject: params.subject || "",
        link: undefined
      };
    }

    const initalValues = {
      text: initial.text,
      link: link.value ? [link] : []
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
