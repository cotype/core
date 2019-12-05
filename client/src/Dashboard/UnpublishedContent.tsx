import React from "react";
import Header from "./Header";
import ItemList from "./ItemList";
import api from "../api";

export default function UnpublishedContent() {
  return (
    <>
      <Header>Unpublished changes</Header>
      <ItemList
        fetchItems={(offset, limit) =>
          api.get(`/dashboard/unpublished?limit=${limit}&offset=${offset}`)
        }
        noResultText="There are no unpublished changes"
      ></ItemList>
    </>
  );
}
