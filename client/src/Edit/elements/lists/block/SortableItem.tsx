import * as Cotype from "../../../../../../typings";
import React from "react";
import { SortableElement, SortableHandle } from "react-sortable-hoc";
import styled, { css } from "styled-components/macro";
import { Field, ArrayHelpers, FormikProps, getIn } from "formik";
import Icon from "../../../../common/icons";
import { ITEM_VALUE_KEY } from "./Input";
import { hasActuallyErrors } from "../../../formHelpers";

const DragHandleIcon = styled(Icon.DragHandle)`
  user-select: none;
  opacity: 0.8;
  cursor: move;
  position: absolute;
  z-index: 0;
  top: 9px;
  left: calc(-12px - 0.5 * var(--input-min-height));
  transition: all 0.2s cubic-bezier(0.55, 0, 0.1, 1);
  & path {
    fill: #fff;
  }
  :hover {
    opacity: 1;
  }
`;

const hasErrorClass = css`
  color: #fff;
  background: rgba(250, 57, 135, 0.05);
  border-color: var(--error-color);
  & > div {
    color: var(--dark-color);
  }
`;

type Item = {
  isSorting: boolean;
  hasError?: boolean;
  schedule: Cotype.Schedule;
};

function color(schedule: Cotype.Schedule) {
  const { visibleFrom, visibleUntil } = schedule;
  if (!visibleFrom && !visibleUntil) return "var(--primary-color)";
  const now = new Date();
  const future = visibleFrom && new Date(visibleFrom) > now;
  const past = visibleUntil && new Date(visibleUntil) < now;
  return future || past ? "#4A4A4A" : "#4ECF8E";
}

export const Item = styled("div")<Item>`
  user-select: ${p => (p.isSorting ? "none" : "auto")};
  background-color: var(--transparent-grey);
  display: flex;
  margin-bottom: 10px;
  box-sizing: border-box;
  position: relative;
  border-left: var(--input-min-height) solid ${p => color(p.schedule)};
  padding: 14px 32px 14px 21px;
  border-radius: 4px;
  ${p => p.hasError && hasErrorClass};
`;

type P = {
  sortable?: boolean;
  isSorting?: boolean;
};
export const ItemField = styled("div")`
  flex: 1;
  position: relative;
  :hover > svg,
  :hover > .item-action {
    opacity: ${(p: P) => (p.isSorting ? 0.5 : 1)};
  }
`;

export const ItemActions = styled("div")`
  user-select: none;
  opacity: 0.5;
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  top: 0;
  right: 0;
  transition: all 0.2s cubic-bezier(0.55, 0, 0.1, 1);
  :hover {
    opacity: 1;
  }
`;

export const ItemAction = styled("button")`
  user-select: none;
  border-radius: 50%;
  border: none;
  width: 4em;
  height: 4em;
  background: #fff;
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
  & svg {
    color: var(--primary-color);
  }
  & svg:not(:last-child) {
    margin-right: 0.8em;
  }
`;

const DragHandle = SortableHandle(() => <DragHandleIcon />);

type SortableItem = {
  sortIndex: number;
  sortable: boolean | undefined;
  ItemComponent: React.ComponentType<any> & {
    validate: (value: any, itemType: any) => void;
  };
  itemType;
  arrayHelpers: ArrayHelpers & { form: FormikProps<any> };
  renderItemOptions: (
    arrayHelpers: ArrayHelpers & { form: FormikProps<any> },
    sortIndex: number,
    length: number,
    sortable: boolean
  ) => React.ReactNode;
  name: string;
  length: number;
  isSorting: boolean;
  schedule: Cotype.Schedule;
};
const SortableItem = SortableElement(
  ({
    sortIndex,
    sortable,
    ItemComponent,
    itemType,
    arrayHelpers,
    renderItemOptions,
    name,
    length,
    isSorting,
    schedule
  }: SortableItem) => {
    const fieldName = `${name}.${sortIndex}.${ITEM_VALUE_KEY}`;
    const error = getIn(arrayHelpers.form.errors, fieldName);
    return (
      <Item
        schedule={schedule}
        isSorting={isSorting}
        hasError={hasActuallyErrors(error)}
      >
        {sortable && <DragHandle />}
        <ItemField sortable={sortable} isSorting={isSorting}>
          <Field
            name={fieldName}
            render={props => <ItemComponent {...props} {...itemType} />}
            {...itemType}
            validate={value => {
              if (typeof ItemComponent.validate === "function") {
                return ItemComponent.validate(value, itemType);
              }
            }}
          />
        </ItemField>
        <ItemActions className="item-action">
          {renderItemOptions(arrayHelpers, sortIndex, length, !!sortable)}
        </ItemActions>
      </Item>
    );
  }
);

export default SortableItem;
