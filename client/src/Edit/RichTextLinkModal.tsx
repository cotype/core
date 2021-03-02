import React, { Component } from "react";
import { Formik, FormikActions, FormikProps } from "formik";
import { Cols, Content } from "../common/page";
import { Input } from "./elements";
import { Button, paths } from "@cotype/ui";
import ModalDialog from "../common/ModalDialog";
import { Fields, RichtextType, UnionTypeTypes } from "../../../typings";
import { parse } from "qs";
import _pick from "lodash/pick";

export const errorClass = "error-field-label";

const types = {
  link: {
    type: "object",
    label: "Link",
    icon: "link-variant",
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
    icon: "image-outline",
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
    icon: "email-outline",
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
  },
  tel: {
    type: "object",
    label: "Telefon",
    icon: "phone",
    fields: {
      phoneNumber: {
        type: "string",
        label: "Telefonnummer",
        required: true,
        validationRegex: "^\\+?[0-9]{3,}$",
        regexError: "Has to be a valid phone number"
      }
    }
  }
};

type Props = {
  onSave: (text: string, link: string | false) => void;
  onClose: () => void;
  initial: { text: string; link: string };
  linkFormats: RichtextType["linkFormats"];
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

    if (
      values.link[0].value._type === "tel" &&
      values.link[0].value.phoneNumber
    ) {
      const link = "tel:" + values.link[0].value.phoneNumber;
      this.props.onSave(values.text.trim(), link);
    }
  };

  render() {
    const { linkFormats = ["link", "mail", "media", "tel"] } = this.props;
    const model: Fields = {
      link: {
        label: "Verlinkung",
        type: "list",
        minLength: 0,
        maxLength: 1,
        item: {
          type: "union",
          types: _pick(types, linkFormats) as UnionTypeTypes
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

    const internalLinkMatch = /\$intern:([\w]*):([0-9]*)\$/gm.exec(
      initial.link
    );

    if (internalLinkMatch) {
      link.value = {
        _type: "link",
        link: {
          model: internalLinkMatch[1],
          id: internalLinkMatch[2]
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

    const telMatch = /tel:(\+?[0-9]{3,})/gm.exec(initial.link);

    if (telMatch) {
      link.value = {
        _type: "tel",
        phoneNumber: telMatch[1],
        link: undefined
      };
    }

    const initialValues = {
      text: initial.text,
      link: link.value ? [link] : []
    };
    return (
      <Formik
        initialValues={initialValues}
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
