import React from "react";
import { ArrayHelpers, FormikProps } from "formik";
import { SortableContainer } from "react-sortable-hoc";
import SortableItem from "./SortableItem";

type SortableList = {
  items: ({ key: number | string; value: { _type: string } })[];
  name: string;
  sortable: boolean | undefined;
  ItemComponent: React.ComponentType<any> & { validate: () => void };
  itemType;
  arrayHelpers: ArrayHelpers & { form: FormikProps<any> };
  removeItem: (index: number) => void;
  isSorting: boolean;
};
const SortableList = SortableContainer(({ items, ...props }: SortableList) => {
  return (
    <div>
      {items &&
        items
          // only show data for existing models
          .filter(i => {
            // no type check necessary
            if (!props.itemType.types && !(i.value || {})._type) return true;
            return (
              i.value._type &&
              props.itemType.types.hasOwnProperty(i.value._type)
            );
          })
          .map((item, index) => (
            <SortableItem
              disabled={props.sortable ? false : true}
              key={item.key}
              index={index}
              length={items.length}
              // point to the index of the unfiltered array
              sortIndex={items.findIndex(i => i.key === item.key)}
              {...props}
            />
          ))}
    </div>
  );
});

export default SortableList;
