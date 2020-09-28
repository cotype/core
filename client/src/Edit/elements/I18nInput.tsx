import React, { Component } from "react";
import { Field, FieldProps, getIn } from "formik";
import inputs from "./inputs";
import { Language, Type } from "../../../../typings";
import { ITEM_VALUE_KEY } from "./lists/block/Input";
import _omit from "lodash/omit";
import serverSideProps from "./serverSideProps";
import { titleCase } from "title-case";
import { hasActuallyErrors } from "../formHelpers";
import Fields from "../../common/Fields";
import styled from "styled-components";

const HideBox = styled.div`
  display: none;
`;

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
    return "Translateable";
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
    console.log("XX", this.props);

    return (
      <Fields
        layout={"inline"}
        fields={
          this.props.activeLanguages
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
                    value: value[l.key]
                  }}
                  render={props => <Input {...fieldProps} {...props} />}
                  validate={value => {
                    if (typeof Input.validate === "function") {
                      return Input.validate(value, this.props);
                    }
                  }}
                />
              );
              return {
                label: "",
                element: element,
                key: l.key,
                error: hasActuallyErrors(error)
                  ? error
                  : langError
                  ? `Field in other language wrong: ${Object.keys(
                      langError
                    ).map(
                      le =>
                        this.props.activeLanguages?.find(aL => aL.key === le)
                          ?.title
                    ).join(', ')}`
                  : undefined,
                hidden: this.props.activeLanguage?.key !== l.key
              };
            })
            .filter(Boolean) as any
        }
      />
    );
  }
}
