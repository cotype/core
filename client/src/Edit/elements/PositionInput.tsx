import React, { Component } from "react";
import { FieldProps } from "formik";
import { Button, paths } from "@cotype/ui";
import PositionModal from "../PositionModal";
import * as Cotype from "../../../../typings";

type Props = FieldProps<any> & {
  model: Cotype.Model;
  id: string;
};
export default class PositionInput extends Component<Props, { show: boolean }> {
  static validate(value: any, props: Props) {
    return false;
  }
  static getDefaultValue(props: Props) {
    return "";
  }

  state = {
    show: false
  };
  showModal = () => {
    this.setState({ show: true });
  };
  hideModal = () => {
    this.setState({ show: false });
  };
  onSave = (postitionString: string) => {
    const { field, form } = this.props;
    form.setFieldValue(field.name, postitionString);
    this.hideModal();
  };
  render() {
    const { field, form, model, id, ...props } = this.props;
    const { show } = this.state;

    const { value, ...fieldProps } = field;
    return (
      <>
        <Button icon={paths.Sort} type="button" onClick={this.showModal}>
          set position
        </Button>
        {show && (
          <PositionModal
            onClose={this.hideModal}
            onSave={this.onSave}
            model={model}
            id={id}
          />
        )}
        <input value={value || ""} {...fieldProps} {...props} type="hidden" />
      </>
    );
  }
}
