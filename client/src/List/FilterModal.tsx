import React, { Component } from "react";
import { Formik, FormikActions, FormikProps } from "formik";
import { Cols, Content } from "../common/page";
import { Input } from "../Edit/elements";
import Button from "../common/Button";
import { paths } from "../common/icons";
import ModalDialog from "../common/ModalDialog";
import { Filter } from "../utils/extractFilter";

export const errorClass = "error-field-label";
export type FilterValue =
  | string
  | boolean
  | number
  | { id: number; model: string };
type Props = {
  onSave: (values: {
    field: string;
    operation: string;
    value: FilterValue;
  }) => void;
  onClose: () => void;
  filter: Filter;
  initial: { field: string; operation: string; value: FilterValue };
};
type State = {
  values: {
    field: string;
    operation: string;
    value: FilterValue;
  };
};

const modalDialogStyle = {
  width: "80vw",
  background: "#f5f5f5",
  maxWidth: 800
};
class FilterModal extends Component<Props, State> {
  state: State = {
    values: {
      field: "none",
      operation: "none",
      value: ""
    }
  };
  constructor(props) {
    super(props);
    this.state.values = props.initial;
    if (this.state.values.field !== "none") {
      const filter = this.props.filter[this.state.values.field];
      if (
        filter.type === "content" &&
        typeof this.state.values.value === "number"
      ) {
        this.state.values.value = {
          id: this.state.values.value,
          model: "contentPages"
        };
      }
    }
  }
  onSubmit = (
    values: {
      field: string;
      operation: string;
      value: FilterValue;
    },
    { setSubmitting, setFieldError }: FormikActions<any>
  ) => {
    let val: FilterValue = "";
    if (values.field === "none") {
      setFieldError("field", "Please select a field");
      return;
    }
    if (values.operation === "none") {
      setFieldError("operation", "Please select a comparison");
      return;
    }
    if (values.value === null) {
      values.value = "";
    }
    if (typeof values.value === "boolean") {
      val = !!values.value;
    } else if (typeof values.value === "object") {
      val = values.value;
    } else if (typeof values.value === "string") {
      val = values.value.trim();
    } else {
      val = values.value;
    }
    if (val === "") {
      setFieldError("value", "Please fill out a value");
      return;
    }
    this.props.onSave({
      ...values,
      value: val
    });
  };
  onDeleteFilter = () => {
    this.props.onSave({
      field: "none",
      operation: "none",
      value: ""
    });
  };

  render() {
    let filterModel: any = {
      field: {
        type: "string",
        input: "select",
        label: "Field:",
        values: [
          { label: "please choose", value: "none", disabled: true },
          ...Object.entries(this.props.filter).map(([key, val]: any) => ({
            label: val.label || key.charAt(0).toUpperCase() + key.slice(1),
            value: key
          }))
        ]
      }
    };
    const { values } = this.state;
    if (values.field !== "none") {
      filterModel = {
        ...filterModel,
        operation: {
          type: "string",
          input: "select",
          label: "Comparison operator:",
          values: ["=", "contains"]
        },
        value: {
          type: "string",
          label: "Value"
        }
      };
      const filter = this.props.filter[values.field];
      if (filter.input === "date" || filter.type === "date") {
        filterModel.operation.values = [">", ">=", "=", "<=", "<"];
        filterModel.value.input = "date";
      }
      if (filter.input === "number" || filter.type === "number") {
        filterModel.operation.values = [">", ">=", "=", "<=", "<"];
        filterModel.value.input = "number";
      }
      if (filter.type === "list") {
        filterModel.operation.values = ["=", "contains"];
        filterModel.value.label = "value of list entry";
      }
      if (filter.type === "content") {
        filterModel.operation.values = ["="];
        filterModel.value.label = "referenced document";
        filterModel.value.type = "content";
        filterModel.value.models = filter.models || [];
      }
      if (filter.type === "boolean") {
        filterModel.operation.values = ["="];
        filterModel.value.type = "boolean";
      }
      filterModel.operation.values.unshift({
        label: "please choose",
        value: "none"
      });
    }

    return (
      <Formik
        key={values.field}
        initialValues={values}
        validate={vals => this.setState({ values: vals })}
        onSubmit={this.onSubmit}
        render={(form: FormikProps<any>) => {
          const { handleSubmit } = form;
          const actions = [
            <Button icon={paths.Trash} onClick={this.onDeleteFilter} light>
              Clear
            </Button>,
            <Button icon={paths.Save} onClick={handleSubmit as any}>
              Apply
            </Button>
          ];
          return (
            <ModalDialog
              onClose={this.props.onClose}
              title="Filter"
              style={modalDialogStyle}
              actionButtons={actions}
              icon={paths.Filter}
            >
              <form onSubmit={handleSubmit}>
                <Cols>
                  <Content style={{ padding: 0 }}>
                    <Input
                      key={"filterModal"}
                      fields={filterModel}
                      form={form}
                    />
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

export default FilterModal;
