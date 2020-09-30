import React, { Component } from "react";
import { Field, FieldProps, getIn } from "formik";
import inputs from "./inputs";
import { Language, Type } from "../../../../typings";
import _omit from "lodash/omit";
import serverSideProps from "./serverSideProps";
import { hasActuallyErrors } from "../formHelpers";
import Fields from "../../common/Fields";

type Props = FieldProps<any> &
  Type & {
    activeLanguages?: Language[];
    activeLanguage?: Language;
    name: string;
    value: any;
  };
export default class I18nInput extends Component<Props> {
  static getDefaultValue(props: Props, activeLanguages?: Language[]) {
    const Input = inputs.get(props, false);
    if (!activeLanguages) {
      return null;
    }
    return activeLanguages.reduce<Record<string, unknown>>((acc, l) => {
      acc[l.key] =
        Input.getDefaultValue && Input.getDefaultValue(props, activeLanguages);
      return acc;
    }, {});
  }

  static getHint() {
    return "🌍";
  }

  static validate(value: any, props: Props, activeLanguages?: Language[]) {
    const Input = inputs.get(props, false);

    if (!activeLanguages) {
      return null;
    }
    return activeLanguages.reduce<Record<string, unknown>>((acc, l) => {
      acc[l.key] = Input.validate((value || {})[l.key], props, activeLanguages);
      return acc;
    }, {});
  }

  render() {
    if (!this.props.activeLanguages) {
      return null;
    }
    const { name, value } = this.props.field;
    const Input = inputs.get(this.props, false);
    const fieldProps = {
      ..._omit(this.props, serverSideProps)
    };
    return (
      <Fields
        layout={"inline"}
        fields={this.props.activeLanguages
          .map(l => {
            const fieldName = `${name}.${l.key}`;
            const langError = getIn(this.props.form.errors, name);
            const error = getIn(this.props.form.errors, fieldName);

            const element = (
              <Field
                {...fieldProps}
                name={fieldName}
                field={{
                  ...this.props.field,
                  name: fieldName,
                  value:
                    value && typeof value === "object" && l.key in value
                      ? value[l.key]
                      : Input.getDefaultValue &&
                        Input.getDefaultValue(
                          this.props,
                          this.props.activeLanguages
                        )
                }}
                render={props => (
                  <Input
                    {...fieldProps}
                    {...props}
                    field={{
                      ...props.field,
                      onChange: e => {
                        const getActual = getIn(props.form.values, name);
                        if (getActual !== "object") {
                          props.form.setFieldValue(name, {});
                        }
                        props.field.onChange(e);
                      }
                    }}
                  />
                )}
                validate={b => {
                  if (typeof Input.validate === "function") {
                    return Input.validate(b, this.props);
                  }
                }}
              />
            );
            return {
              label: "",
              element,
              key: l.key,
              error: hasActuallyErrors(error)
                ? error
                : langError
                ? `Field in other language wrong: ${Object.keys(langError)
                    .map(
                      le =>
                        this.props.activeLanguages?.find(aL => aL.key === le)
                          ?.title
                    )
                    .join(", ")}`
                : undefined,
              hidden: this.props.activeLanguage?.key !== l.key
            };
          })
          .filter(Boolean)}
      />
    );
  }
}
