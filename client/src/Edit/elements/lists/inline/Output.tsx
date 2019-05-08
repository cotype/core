import { Type } from "../../../../../../typings";
import React from "react";
import outputs from "../../outputs";
import styled from "react-emotion";
import { Item } from "./SortableItem";

const ItemField = styled("div")`
  flex: 1;
  position: relative;
  padding-right: 0.8em;
`;

type Props = {
  value: any[];
  item: Type;
};

export default (props: Props) => {
  const { value, item: itemType } = props;
  const ItemComponent = outputs.get(itemType);

  return (
    <div>
      {value &&
        value.map((item, index) => (
          <Item key={index} style={{ borderColor: "rgba(0, 0, 0, 0.25)" }}>
            <ItemField>
              <ItemComponent value={item.value} {...itemType} />
            </ItemField>
          </Item>
        ))}
    </div>
  );
};
