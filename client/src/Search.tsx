import { Item } from "../../typings";
import React, { Component } from "react";
import { css } from "react-emotion";
import api from "./api";
import Autocomplete from "./common/Autocomplete";
import ResultItem from "./common/ResultItem";

export const inputClass = css`
  background: none;
  border: none;
  outline: none;
  margin-left: auto;
  width: 300px;
  padding: 0.5em;
  font-size: 14px;
  color: #fff;
  border-bottom: 1px solid hsla(0, 0%, 100%, 0.1);
  ::placeholder {
    color: #fff;
  }
  :focus {
    background: hsla(0, 0%, 100%, 0.1);
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
      this.fetchItems(term).then(({ items }) => this.setState({ items }));
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

  renderItem = (item: Item) => <ResultItem item={item} />;

  itemToString = (i: Item) => (i ? i.title : "");

  render() {
    const { term, items } = this.state;

    return (
      <Autocomplete
        inputClassName={inputClass}
        inputValue={term}
        onInputValueChange={this.handleInput}
        onChange={this.handleChange}
        items={items}
        itemToString={this.itemToString}
        renderItem={this.renderItem}
        style={{ display: "flex", width: 400, zIndex: 3 }}
        placeholder="Search …"
      />
    );
  }
}
