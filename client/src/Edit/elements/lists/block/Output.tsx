import * as Cotype from "../../../../../../typings";
import React from "react";
import outputs from "../../outputs";
import styled from "styled-components/macro";

const ItemField = styled("div")`
  background-color: var(--transparent-grey);
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  box-sizing: border-box;
  position: relative;
  border-left: var(--input-min-height) solid rgba(0, 0, 0, 0.25);
  padding: 14px 32px 14px 21px;
  border-radius: 4px;
  width: 100%;
`;

type Props = {
  value: any[];
  item: Cotype.Type;
  sortable: boolean;
};

export default (props: Props) => {
  const { value, item: itemType } = props;
  const ItemComponent = outputs.get(itemType);
  return (
    <div>
      {value &&
        value.map((item, index) => (
          <ItemField key={index}>
            <ItemComponent value={item.value} {...itemType} layout="inList" />
          </ItemField>
        ))}
    </div>
  );
};
