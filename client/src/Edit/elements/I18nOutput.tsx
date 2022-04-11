import React, { Component } from "react";
import { FieldProps } from "formik";
import { Language, Type } from "../../../../typings";
import _omit from "lodash/omit";
import serverSideProps from "./serverSideProps";
import Fields from "../../common/Fields";
import outputs from "./outputs";

type Props = FieldProps<any> &
  Type & {
    activeLanguages?: Language[];
    activeLanguage?: Language;
    name: string;
    value: any;
  };
export default class I18nOutput extends Component<Props> {
  render() {
    if (!this.props.activeLanguages) {
      return null;
    }
    const { value } = this.props;
    const Output = outputs.get(this.props, false);
    const fieldProps = {
      ..._omit(this.props, serverSideProps)
    };
    if (!Output) {
      return null;
    }
    return (
      <Fields
        layout={"inList"}
        fields={this.props.activeLanguages
          .map(l => {
            const element = (
              <Output
                {...fieldProps}
                value={value && l.key in value ? value[l.key] : ""}
              />
            );
            return {
              label: l.title + " 🌍",
              element,
              key: l.key
            };
          })
          .filter(Boolean)}
      />
    );
  }
}
