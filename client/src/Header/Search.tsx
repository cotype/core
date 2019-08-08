import { SearchResultItem } from "../../../typings";
import React, { Component } from "react";
import { css } from "styled-components/macro";
import api from "../api";
import Autocomplete from "../common/Autocomplete";
import ResultItem from "../common/ResultItem";
import orderSearchResults from "../utils/orderSearchResults";

export const inputClass = css`
  background: rgba(255, 255, 255, 0.05);
  border: none;
  outline: none;
  margin-left: auto;
  width: 300px;
  padding: 0.5em;
  font-size: 14px;
  border-radius: 3px;
  color: #fff;
  ::placeholder {
    color: #fff;
  }
  :focus {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export default class Search extends Component {
  state = {
    term: "",
    items: []
  };

  handleInput = (term: string | undefined) => {
    this.setState({ term });
    if (term && term.length) {
      this.fetchItems(term).then(({ items }) =>
        this.setState({ items: orderSearchResults(items, this.state.term) })
      );
    } else {
      this.setState({ items: [] });
    }
  };

  handleChange = (
    selectedItem: any,
    stateAndHelpers: { clearSelection: () => void }
  ) => {
    this.setState({ term: "", items: [] });
    stateAndHelpers.clearSelection();
  };

  fetchItems = (q: string) => {
    return q ? api.get("/content", { q }) : Promise.resolve([]);
  };

  renderItem = (item: SearchResultItem, term: string) => {
    return <ResultItem item={item} term={term} />;
  };

  itemToString = (i: SearchResultItem) => (i ? i.title : "");

  render() {
    const { term, items } = this.state;

    return (
      <Autocomplete
        inputElementCss={inputClass}
        inputValue={term}
        onInputValueChange={this.handleInput}
        onChange={this.handleChange}
        items={items}
        itemToString={this.itemToString}
        renderItem={item => this.renderItem(item, this.state.term)}
        style={{ display: "flex", width: 400, zIndex: 3 }}
        placeholder="Search …"
      />
    );
  }
}
