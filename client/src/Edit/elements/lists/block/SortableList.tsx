import * as Cotype from "../../../../../../typings";
import React from "react";
import { ArrayHelpers, FormikProps } from "formik";
import { SortableContainer } from "react-sortable-hoc";
import SortableItem from "./SortableItem";
import styled from "styled-components/macro";
import { dragClass } from "./Input";

type Item = {
  key: number | string;
  value: { _type: string };
} & Cotype.Schedule;

type SortableList = {
  items: Item[];
  name: string;
  sortable: boolean | undefined;
  ItemComponent: React.ComponentType<any> & { validate: () => void };
  itemType;
  arrayHelpers: ArrayHelpers & { form: FormikProps<any> };
  renderItemOptions: (
    arrayHelpers: ArrayHelpers & { form: FormikProps<any> },
    sortIndex: number,
    length: number
  ) => React.ReactNode;
  isSorting: boolean;
};
const BasicSortableList = SortableContainer(
  ({ items, ...props }: SortableList) => {
    const { types } = props.itemType;
    return (
      <div>
        {items &&
          items
            // only show data for existing models
            .filter(i => {
              // no type check necessary
              if (!types && !(i.value || {})._type) return true;
              return i.value._type && i.value._type in types;
            })
            .map((item, index) => (
              <SortableItem
                disabled={props.sortable ? false : true}
                key={item.key}
                index={index}
                length={items.length}
                schedule={item}
                // point to the index of the unfiltered array
                sortIndex={items.findIndex(i => i.key === item.key)}
                {...props}
              />
            ))}
      </div>
    );
  }
);
export const DRAG_HELPER_CLASS = "dragging-helper-class";
const SortableList = styled(BasicSortableList)`
  &.${DRAG_HELPER_CLASS} {
    ${dragClass}
  }
`;
export default SortableList;
