import { Type } from "../../../../typings";
import React, { Component } from "react";
import { Field, FieldProps, getIn } from "formik";
import styled from "react-emotion";
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
    values?: string[];
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
    api
      .get(this.props.keys.fetch)
      .then(fetched =>
        this.setState({ options: this.state.options.concat(fetched) })
      );
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

  render() {
    const { field, values, form } = this.props;
    const { options } = this.state;
    if (!options) return null;
    const component = inputs.get(values);
    const prefix = field ? `${field.name}.` : "";
    const { value } = field;

    const existingKeys = options.filter(k => value && k in value);
    const remainingKeys = options.filter(k => value && !(k in value));

    return (
      <div>
        <Fields
          layout="horizontal"
          fields={existingKeys.map(key => {
            const label = (
              <div style={{ display: "flex" }}>
                {key}
                <Action onClick={() => this.remove(key)}>remove</Action>
              </div>
            );

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
            label,
            onClick: () => {
              this.add(label);
            }
          }))}
        />
      </div>
    );
  }
}
