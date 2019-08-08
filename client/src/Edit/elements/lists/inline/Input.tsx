import * as Cotype from "../../../../../../typings";
import React, { Component, Fragment } from "react";
import styled from "styled-components/macro";
import { FieldProps, FieldArray } from "formik";
import inputs from "../../inputs";
import Button from "../../../../common/Button";
import ListButton from "../../../../common/ListButton";
import SortableList from "./SortableList";
import outputs from "../../outputs";
import { DRAG_HELPER_CLASS } from "../block/SortableList";

export const ITEM_VALUE_KEY = "value";

const NewItemActions = styled("div")`
  & > *:not(:last-child) {
    margin-right: 1em !important;
  }
  margin-top: 10px;
`;
const Cancel = styled("span")`
  cursor: pointer;
  color: var(--dark-grey);
`;

type Props = FieldProps<any> & Cotype.ListType;
type State = {
  Factory?: React.ComponentClass | null;
  isSorting: boolean;
  newItemValue: string | null;
};
export default class ChipListInput extends Component<Props, State> {
  static getDefaultValue(props: Props) {
    return [];
  }

  static validate(value: string, { required }) {
    if (required && (!value || !value.length)) {
      return "This field is required";
    }
  }

  state: State = {
    isSorting: false,
    newItemValue: ""
  };

  createItem = (insert, item = null) => {
    let { newItemValue } = this.state;
    if (item) newItemValue = item;
    if (!newItemValue) return;

    const { value } = this.props.field;

    let maxId = 0;
    if (value) {
      value.forEach(v => {
        if (v.key > maxId) maxId = v.key;
      });
      maxId++;
    }

    insert({ key: maxId, [ITEM_VALUE_KEY]: newItemValue });
    this.setState({ newItemValue: "" });
  };

  createFactory = arrayHelpers => {
    const itemType = this.props.item;
    const InputComponent = inputs.get(itemType);

    let Factory;
    if (InputComponent.itemFactory) {
      Factory = InputComponent.itemFactory(itemType, item => {
        if (item) this.createItem(i => arrayHelpers.push(i), item);
        this.setState({ Factory: null });
      });
    } else {
      const setFieldValue = (n, v) => this.setState({ newItemValue: v });
      const onChange = e => this.setState({ newItemValue: e.target.value });

      Factory = () => (
        <div>
          <InputComponent
            {...itemType}
            form={{ setFieldValue }}
            field={{ value: this.state.newItemValue, name: "new", onChange }}
            layout="inList"
            placeholder="Search for another one..."
            value={this.state.newItemValue}
          />
          <NewItemActions>
            <Button
              type="submit"
              onClick={() =>
                this.createItem(item => {
                  arrayHelpers.push(item);
                  this.setState({
                    Factory: null
                  });
                })
              }
            >
              <span>OK</span>
            </Button>
            <Cancel
              onClick={() =>
                this.setState({
                  Factory: null
                })
              }
            >
              Abbrechen
            </Cancel>
          </NewItemActions>
        </div>
      );
    }
    this.setState({ Factory });
  };

  render() {
    const { field, item: itemType, sortable, maxLength } = this.props;
    const { name, value } = field;
    const ItemComponent = outputs.get(itemType);
    const { Factory, isSorting } = this.state;

    const isNotAllowedToAddMoreItems = maxLength
      ? value && value.length >= maxLength
      : false;

    return (
      <FieldArray
        validateOnChange={false}
        name={name}
        render={arrayHelpers => (
          <Fragment>
            <SortableList
              lockToContainerEdges
              axis="xy"
              items={value}
              ItemComponent={ItemComponent}
              sortable={sortable}
              itemType={itemType}
              removeItem={index => arrayHelpers.remove(index)}
              arrayHelpers={arrayHelpers}
              name={name}
              helperClass={DRAG_HELPER_CLASS}
              onSortStart={() => this.setState({ isSorting: true })}
              onSortEnd={({ oldIndex, newIndex }) => {
                arrayHelpers.move(oldIndex, newIndex);
                this.setState({ isSorting: false });
              }}
              shouldCancelStart={(e: any) => {
                const disabledElements = ["path", "svg", "button"];
                if (e.target.tagName !== undefined) {
                  if (
                    disabledElements.indexOf(e.target.tagName.toLowerCase()) !==
                    -1
                  ) {
                    return true;
                  }
                }
                return false;
              }}
              isSorting={isSorting}
            />
            {!isNotAllowedToAddMoreItems &&
              (Factory ? (
                <Factory />
              ) : (
                <ListButton
                  type="button"
                  onClick={() => this.createFactory(arrayHelpers)}
                >
                  Hinzufügen
                </ListButton>
              ))}
          </Fragment>
        )}
      />
    );
  }
}
