import React from "react";
import Header from "./Header";
import ItemList from "./ItemList";
import api from "../api";

export default function UnpublishedContent() {
  return (
    <>
      <Header>Unpublished changes</Header>
      <ItemList
        fetchItems={() => api.get("/dashboard/unpublished")}
        noResultText="There are no unpublished changes"
      ></ItemList>
    </>
  );
}
