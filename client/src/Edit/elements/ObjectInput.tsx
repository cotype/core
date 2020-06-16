import * as Cotype from "../../../../typings";
import React, { Component } from "react";
import { Field, FieldProps, getIn } from "formik";
import _omit from "lodash/omit";
import { titleCase } from "title-case";
import Fields, { FieldLayout } from "../../common/Fields";
import inputs from "./inputs";
import ObjectOutput from "./ObjectOutput";
import ModalDialog from "../../common/ModalDialog";
import Button from "../../common/Button";
import styled from "styled-components/macro";
import { required } from "./validation";
import { paths } from "../../common/icons";
import { hasActuallyErrors } from "../formHelpers";
import serverSideProps from "./serverSideProps";

const modalStyle = {
  width: "80vw",
  height: "90vh",
  background: "#f5f5f5",
  maxWidth: 1200
};
const Summary = styled("div")`
  flex: 1;
  display: flex;
  margin-right: 1em;
`;
type Props = Partial<FieldProps<any>> & {
  layout?: FieldLayout;
  fields: Cotype.Fields;
  form: any;
  label?: string;
  modalView?: boolean;
  model?: Cotype.Model;
  id?: string;
};

type State = {
  showModal?: boolean;
  initalValues?: any;
  initalErrors?: any;
};

export default class ObjectInput extends Component<Props> {
  static getDefaultValue({ fields }) {
    const initialValues = {};
    Object.keys(fields).forEach(id => {
      const f = fields[id];
      if (f.type === "references") {
        return;
      }
      const component = inputs.get(f);
      initialValues[id] =
        component && component.getDefaultValue
          ? component.getDefaultValue(f)
          : null;
    });
    return initialValues;
  }

  static validate(value, props) {
    const isRequired = required(value, props);
    if (isRequired) return isRequired;

    const errors = {};
    Object.keys(props.fields).forEach(f => {
      if (props.fields[f].type === "references") {
        return;
      }
      const component = inputs.get(props.fields[f]);
      const error = component.validate((value || {})[f], props.fields[f]);
      if (error) errors[f] = error;
    });
    if (Object.keys(errors).length > 0) return errors;
  }

  state: State = {
    showModal: false
  };

  toggleModal = () => {
    this.setState((prevState: State) => {
      const { form, field } = this.props;
      const nextState = {
        ...prevState,
        showModal: !prevState.showModal
      };

      if (form && field) {
        const initalErrros = getIn(form.errors, field.name);
        return {
          ...nextState,
          initalValues: JSON.parse(JSON.stringify(form.values)),
          initalErrors: initalErrros
            ? JSON.parse(JSON.stringify(initalErrros))
            : initalErrros
        };
      }

      return nextState;
    });
  };

  renderSummary() {
    const { field, fields } = this.props;

    if (!field) return null;
    const { value } = field;
    const image = ObjectOutput.getSummaryImage({ value, fields });
    const text = ObjectOutput.getSummaryText({ value, fields });

    return (
      <Summary style={{ flex: 1 }}>
        {image && <div style={{ marginRight: "1em" }}>{image}</div>}
        {text && <div>{text}</div>}
      </Summary>
    );
  }

  renderModal() {
    if (!this.state.showModal) return null;
    const { label, form, field, id } = this.props;

    const onSubmit = () => {
      if (!field) {
        return;
      }

      if (form.validateField(field.name) instanceof Promise) {
        form.validateField(field.name).then(err => {
          const errors = JSON.stringify(err);
          if (!errors) {
            this.toggleModal();
          }
        });
      } else {
        form.validateField(field.name);
        setTimeout(() => {
          const err = !!getIn(this.props.form.errors, field.name);
          if (!err) {
            this.toggleModal();
          }
        }, 50);
      }
    };

    const onClose = () => {
      if (field) {
        form.setValues(this.state.initalValues);
        form.setFieldError(field.name, this.state.initalErrors);
      }

      this.toggleModal();
    };

    const actions = [
      <Button icon={paths.Save} onClick={onSubmit}>
        Übernehmen
      </Button>,
      <Button icon={paths.Clear} onClick={onClose} light>
        Abbrechen
      </Button>
    ];

    return (
      <ModalDialog
        title={label ? label : "Edit"}
        onClose={onClose}
        actionButtons={actions}
        style={modalStyle}
      >
        <ObjectInput
          {...this.props}
          modalView={false}
          layout="vertical"
          id={id}
        />
      </ModalDialog>
    );
  }

  render() {
    const { form, field, fields, layout, modalView, model, id } = this.props;

    if (modalView) {
      return (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end"
            }}
          >
            {this.renderSummary()}
            <div>
              <Button onClick={this.toggleModal}>Edit</Button>
            </div>
          </div>
          {this.renderModal()}
        </div>
      );
    }
    const fieldKeys = Object.keys(fields);
    const prefix = field ? `${field.name}.` : "";
    return (
      <Fields
        layout={layout}
        fields={
          fieldKeys
            .map(key => {
              const f = fields[key];
              const { label: l, ...props } = f;

              if (
                "hidden" in f ||
                f.type === "references" ||
                f.type === "virtual"
              )
                return null;

              const component = inputs.get(f);
              let label = l || titleCase(key);

              if (component && typeof component.getHint === "function") {
                const getHint = component.getHint(fields[key]);
                if (getHint) label += ` ${getHint}`;
              }

              if ("required" in f && f.required) {
                label += "*";
              }

              const name = `${prefix}${key}`;
              const error = getIn(form.errors, name);

              const fieldProps = {
                ..._omit(props, serverSideProps),
                models:
                  "model" in props
                    ? [props.model]
                    : "models" in props
                    ? props.models
                    : undefined
              };
              const element = (
                <Field
                  name={name}
                  component={component}
                  model={model}
                  id={id}
                  {...fieldProps}
                  validate={value => {
                    if (typeof component.validate === "function") {
                      return component.validate(value, props);
                    }
                  }}
                />
              );
              return {
                label,
                element,
                key,
                error: hasActuallyErrors(error) ? error : undefined
              };
            })
            .filter(Boolean) as any
        }
      />
    );
  }
}
