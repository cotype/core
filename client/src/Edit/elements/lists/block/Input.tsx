import * as Cotype from "../../../../../../typings";
import React, { Component } from "react";
import styled, { css } from "react-emotion";
import { FieldProps, FieldArray } from "formik";
import _omit from "lodash/omit";
import inputs from "../../inputs";
import serverSideProps from "../../serverSideProps";
import ListButton from "../../../../common/ListButton";
import MoreButton from "../../../../common/MoreButton";
import Schedule from "../../../../common/Schedule";
import SortableList from "./SortableList";

export const ITEM_VALUE_KEY = "value";

export const dragClass = css`
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 4;
`;

const Root = styled("div")`
  margin-bottom: 20px;
`;

type Props = FieldProps<any> & Cotype.ListType;
type State = {
  Factory?: React.ComponentClass | null;
  isSorting: boolean;
  schedule?: any;
  onSchedule?: any;
};
export default class ListInput extends Component<Props, State> {
  static getDefaultValue(props: Props) {
    return [];
  }

  static validate(value: string, { required }) {
    if (required && (!value || !value.length)) {
      return "This field is required";
    }
  }

  state: State = {
    isSorting: false
  };

  get mustNotAddItems() {
    const {
      maxLength,
      field: { value }
    } = this.props;
    return maxLength ? value && value.length >= maxLength : false;
  }

  renderItemOptions = (arrayHelpers: any, index: number, lastIndex: number) => {
    const {
      sortable,
      schedule,
      field: { value }
    } = this.props;
    const actions = [
      {
        label: "Remove",
        onClick: () => arrayHelpers.remove(index)
      }
    ];
    if (!this.mustNotAddItems) {
      actions.push({
        label: "Add new item",
        onClick: () =>
          this.createItem(item => arrayHelpers.insert(index + 1, item))
      });
    }

    if (schedule) {
      actions.unshift({
        label: "Schedule",
        onClick: () => {
          const { form, field } = this.props;
          const item = field.value[index];
          const name = `${field.name}[${index}]`;
          this.setState({
            schedule: item,
            onSchedule: (s: Cotype.Schedule) => {
              form.setFieldValue(name, { ...item, ...s });
              this.closeSchedule();
            }
          });
        }
      });
    }

    if (sortable && value && value.length > 1) {
      actions.push(
        {
          label: "Move to top",
          onClick: () => arrayHelpers.move(index, 0)
        },
        {
          label: "Move to Bottom",
          onClick: () => arrayHelpers.move(index, lastIndex)
        }
      );
    }
    return <MoreButton actions={actions} />;
  };

  createItem = insert => {
    const itemType = this.props.item;
    const comp = inputs.get(itemType);

    const value = this.props.field.value || [];
    const key = 1 + value.reduce((max, item) => Math.max(max, item.key), 0);

    if (comp.itemFactory) {
      const Factory = comp.itemFactory(itemType, item => {
        if (item) insert({ key, [ITEM_VALUE_KEY]: item });
        this.setState({ Factory: null });
      });
      this.setState({ Factory });
      return;
    }

    if (comp.getDefaultValue) {
      insert({ key, [ITEM_VALUE_KEY]: comp.getDefaultValue(itemType) });
    } else {
      insert({ key, [ITEM_VALUE_KEY]: null });
    }
  };

  closeSchedule = () => {
    this.setState({ onSchedule: null });
  };

  render() {
    const { field, item: itemType, sortable, addLabel } = this.props;

    const { name, value } = field;
    const ItemComponent = inputs.get(itemType);
    const { Factory, isSorting, schedule, onSchedule } = this.state;

    return (
      <FieldArray
        validateOnChange={false}
        name={name}
        render={arrayHelpers => (
          <Root>
            {value && (
              <SortableList
                lockToContainerEdges
                lockAxis="y"
                items={value}
                ItemComponent={ItemComponent}
                sortable={sortable}
                itemType={_omit(itemType, serverSideProps)}
                renderItemOptions={this.renderItemOptions}
                arrayHelpers={arrayHelpers}
                name={name}
                useDragHandle
                helperClass={dragClass}
                onSortStart={() => this.setState({ isSorting: true })}
                onSortEnd={({ oldIndex, newIndex }) => {
                  arrayHelpers.move(oldIndex, newIndex);
                  this.setState({ isSorting: false });
                }}
                isSorting={isSorting}
              />
            )}
            <ListButton
              type="button"
              disabled={this.mustNotAddItems}
              onClick={() => this.createItem(item => arrayHelpers.push(item))}
            >
              <span>{addLabel || "Add"}</span>
            </ListButton>
            {Factory && <Factory />}
            {onSchedule && (
              <Schedule
                schedule={schedule}
                onClose={this.closeSchedule}
                onSchedule={onSchedule}
              />
            )}
          </Root>
        )}
      />
    );
  }
}
