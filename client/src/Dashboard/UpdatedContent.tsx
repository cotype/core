import React, { useState } from "react";
import styled from "styled-components/macro";
import Header from "./Header";
import api from "../api";
import ItemList from "./ItemList";
import ToggleSwitch from "../common/ToggleSwitch";

const Filter = styled("div")`
  display: inline-flex;
  justify-content: center;
  & > span {
    margin-right: 4px;
  }
`;

export default function UpdatedContent() {
  const [byUser, setByUser] = useState(false);

  return (
    <>
      <Header>
        <span>Recently updated</span>
        <Filter>
          <span>By me</span>
          <ToggleSwitch on={byUser} onClick={() => setByUser(!byUser)} />
        </Filter>
      </Header>
      <ItemList
        key={byUser ? 0 : 1}
        fetchItems={() =>
          api.get(`/dashboard/${byUser ? "updated-by-user" : "updated"}`)
        }
        noResultText="There is no updated content"
      />
    </>
  );
}
