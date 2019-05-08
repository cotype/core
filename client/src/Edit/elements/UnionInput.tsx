import * as Cotype from "../../../../typings";
import React, { Component, Fragment } from "react";
import { FieldProps } from "formik";
import styled from "react-emotion";
import titleCase from "title-case";
import basePath from "../../basePath";
import Button from "../../common/Button";
import ModalDialog from "../../common/ModalDialog";
import ObjectInput from "./ObjectInput";
import inputs from "./inputs";
import { required } from "./validation";

export const TypeLabel = styled("div")`
  color: var(--primary-color);
  font-weight: bold;
  font-size: 16px;
  text-transform: uppercase;
  margin-bottom: 1em;
`;

type IconProps = {
  name: string;
};
const Icon = styled("div")`
  display: inline-block;
  width: 24px;
  height: 24px;
  mask-image: url(${({ name }: IconProps) =>
    `${basePath}/rest/icons/${name}.svg`});
  background-color: var(--accent-color);
  margin-right: 4px;
`;
const WrapFlexCenter = styled("div")`
  display: flex;
  align-items: center;
`;

type Props = FieldProps<any> & {
  types: object;
};
type State = {
  type: string;
};
export default class UnionInput extends Component<Props, State> {
  static getDefaultValue(props: Props) {
    return null;
  }

  static validate(value: any, props) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;

    const type = props.types[value._type];
    const component = inputs.get(type);
    const errors = component.validate(value, type);

    if (errors) return errors;
  }

  static itemFactory(type: Cotype.UnionType, cb: (arg: object | null) => void) {
    return () => (
      <ModalDialog
        title="Choose a type"
        onClose={() => cb(null)}
        style={{ minWidth: 250, maxWidth: 750 }}
      >
        <WrapFlexCenter style={{ flexWrap: "wrap" }}>
          {Object.keys(type.types).map(typeKey => (
            <Button
              light
              key={typeKey}
              // icon={type.types[typeKey].icon}
              onClick={() => cb({ _type: typeKey })}
            >
              <WrapFlexCenter>
                {type.types[typeKey].icon && (
                  <Icon name={type.types[typeKey].icon!} />
                )}
                {type.types[typeKey].label || typeKey}
              </WrapFlexCenter>
            </Button>
          ))}
        </WrapFlexCenter>
      </ModalDialog>
    );
  }

  render() {
    const { field, types, form, ...props } = this.props;
    const { value } = field;
    if (!value) return null;
    const { _type } = value;
    const type = types[_type];
    return (
      <Fragment>
        <TypeLabel>{type.label || titleCase(_type)}</TypeLabel>
        <ObjectInput field={field} form={form} {...type} {...props} />
      </Fragment>
    );
  }
}
