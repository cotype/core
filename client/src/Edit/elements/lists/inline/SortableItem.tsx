import React from "react";
import styled, { css } from "react-emotion";
import { Field, ArrayHelpers, FormikProps } from "formik";
import Icon from "../../../../common/icons";
import { SortableElement } from "react-sortable-hoc";
import { ITEM_VALUE_KEY } from "../block/Input";

type Item = {
  isSorting?: boolean;
  sortable?: boolean | undefined;
};

export const Item = styled("div")`
  box-sizing: border-box;
  user-select: ${(p: Item) => (p.isSorting ? "none" : "auto")};
  color: rgba(0, 0, 0, 0.87);
  border: none;
  cursor: ${(p: Item) => (p.sortable ? "move" : "auto")};
  min-height: var(--input-min-height);
  outline: none;
  padding: 5px;
  display: inline-flex;
  transition: background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
    box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  white-space: nowrap;
  align-items: center;
  border-radius: 4px;
  vertical-align: middle;
  text-decoration: none;
  justify-content: center;
  background-color: var(--transparent-grey);
  margin: 0 10px 10px 0;
  border-left: 5px solid var(--primary-color);
`;

const StyledButton = styled("button")`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  :focus {
    outline: 0;
  }
`;
const clearClass = css`
  color: rgba(0, 0, 0, 0.26);
  margin: 0 4px;
`;

type SortableItem = {
  sortIndex: number;
  sortable: boolean | undefined;
  ItemComponent: React.ComponentType<any> & {
    validate: (value: any, itemType: any) => void;
  };
  itemType;
  arrayHelpers: ArrayHelpers & { form: FormikProps<any> };
  removeItem: (arg: any) => void;
  name: string;
  length: number;
  isSorting: boolean;
};
const SortableItem = SortableElement(
  ({
    sortIndex,
    sortable,
    ItemComponent,
    itemType,
    removeItem,
    name,
    isSorting
  }: SortableItem) => {
    return (
      <Item isSorting={isSorting} sortable={sortable}>
        <Field
          name={`${name}.${sortIndex}.${ITEM_VALUE_KEY}`}
          render={props => (
            <ItemComponent
              {...props}
              {...itemType}
              value={props.field.value}
              layout="inList"
            />
          )}
          {...itemType}
          validate={value => {
            if (typeof ItemComponent.validate === "function") {
              return ItemComponent.validate(value, itemType);
            }
          }}
        />
        <StyledButton type="Button" onClick={() => removeItem(sortIndex)}>
          <Icon.ClearCircle className={clearClass} />
        </StyledButton>
      </Item>
    );
  }
);

export default SortableItem;
