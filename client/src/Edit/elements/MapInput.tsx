import { Type, MapKeyValue } from "../../../../typings";
import React, { Component } from "react";
import { Field, FieldProps, getIn } from "formik";
import styled from "styled-components/macro";
import ActionButton from "../../common/ActionButton";
import api from "../../api";
import Fields from "../../common/Fields";
import inputs from "./inputs";
import { required } from "./validation";

const Action = styled("span")`
  margin-left: 1em;
  opacity: 0;
  cursor: pointer;
  color: var(--accent-color);
  :hover {
    text-decoration: underline;
  }
  tr:hover & {
    opacity: 1;
  }
  transition: opacity 0.5s;
`;

type Props = FieldProps<any> & {
  values: Type;
  keys: {
    values?: MapKeyValue[];
    fetch: string;
  };
};

export default class MapInput extends Component<Props> {
  static getDefaultValue(props: Props) {
    return {};
  }

  static validate(value, props) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;
  }
  state = {
    options: this.props.keys.values || []
  };

  componentDidMount() {
    if (this.props.keys.fetch) {
      api
        .get(this.props.keys.fetch)
        .then(fetched =>
          this.setState({ options: [...this.state.options, ...fetched] })
        );
    }
  }

  add(key: string) {
    const { form, field } = this.props;
    form.setFieldValue(field.name, {
      ...field.value,
      [key]: null
    });
  }

  remove(key: string) {
    const { form, field } = this.props;
    const value = { ...field.value };
    delete value[key];
    form.setFieldValue(field.name, value);
  }

  getValue(v: MapKeyValue) {
    return typeof v === "object" ? v.value : v;
  }

  getLabel(v: MapKeyValue) {
    return typeof v === "object" ? v.label : v;
  }

  render() {
    const { field, values, form } = this.props;
    const { options } = this.state;

    if (!options) return null;
    const component = inputs.get(values);
    const prefix = field ? `${field.name}.` : "";
    const { value } = field;

    const existingKeys = options.filter(
      k => value && this.getValue(k) in value
    );
    const remainingKeys = options.filter(
      k => value && !(this.getValue(k) in value)
    );

    return (
      <div>
        <Fields
          layout="horizontal"
          fields={existingKeys.map(key => {
            const label = (
              <div style={{ display: "flex" }}>
                {this.getLabel(key)}
                <Action onClick={() => this.remove(this.getValue(key))}>
                  remove
                </Action>
              </div>
            );
            key = this.getValue(key);
            const name = `${prefix}${key}`;
            const error = getIn(form.errors, name);

            const element = (
              <Field
                name={`${prefix}${key}`}
                component={component}
                {...values}
              />
            );
            return {
              key,
              label,
              element,
              error
            };
          })}
        />
        <ActionButton
          data-name={field.name}
          label="Add …"
          disabled={!remainingKeys.length}
          actions={remainingKeys.map(label => ({
            label: this.getLabel(label),
            onClick: () => {
              this.add(this.getValue(label));
            }
          }))}
        />
      </div>
    );
  }
}
