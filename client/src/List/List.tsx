import * as Cotype from "../../../typings";
import React, { Component } from "react";
import api from "../api";
import EmptyList from "./EmptyList";
import { RenderInfo } from "../common/ScrollList";
import { Link, match as Match } from "react-router-dom";
import ScrollList from "../common/ScrollList";
import Item from "./Item";
import FilterModal, { FilterValue } from "./FilterModal";
import styled, { css } from "react-emotion";
import { paths } from "../common/icons";
import Icon from "../common/Icon";
import Button from "../common/Button";
import extractFilter from "../utils/extractFilter";
import { testable } from "../utils/helper";

type State = {
  lastRequestedIndex: number;
  items: Cotype.Item[];
  total?: number;
  selected?: string;
  filterOpen: boolean;
  showFunc: (item: Cotype.Item) => boolean;
  filterValues: {
    field: string;
    operation: string;
    value: FilterValue;
  };
  searchTerm: string;
};

type Props = {
  edit: boolean;
  model: Cotype.Model;
  match: Match<any>;
};

const FilterBar = styled("div")`
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  position: sticky;
  top: 0;
  width: 100%;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  padding: 0.65em 1em;
  > form {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
  }
`;
const InvisibleInput = styled("input")<{ hasValue: boolean }>`
  border: none;
  color: var(--primary-color);
  text-align: right;
  width: 100%;
  height: 2em;
  outline: none;
  border-bottom: 1px solid transparent;
  &:focus {
    border-bottom: 1px solid var(--primary-color);
  }
  ${p =>
    p.hasValue &&
    css`
      border-bottom: 1px solid var(--primary-color);
    `}
`;

const modelActionButtons = css`
  background: none;
  padding-right: 0;
  & > svg {
    color: var(--primary-color);
  }
  :hover {
    background: none;
    & > svg {
      color: var(--accent-color);
    }
  }
`;

const addButtonClass = css`
  display: inline-flex;
  align-items: center;
  padding: 0.7em 1em;
  margin-right: 1em;
  border-radius: 3px;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  font-weight: 500;
  font-size: 0.8em;
  background: var(--primary-color);
  :hover {
    background: var(--accent-color);
  }
  color: #fff;
  & svg {
    margin: 0 2px 0 -6px;
  }
`;

export default class ListWithItems extends Component<Props, State> {
  state: State = {
    lastRequestedIndex: 0,
    items: [],
    filterOpen: false,
    showFunc: () => true,
    filterValues: {
      field: "none",
      operation: "none",
      value: ""
    },
    searchTerm: ""
  };

  startIndex = 0;
  searchRef = React.createRef<HTMLInputElement>();
  componentDidMount() {
    this.fetchNextData();
  }

  refresh(searchTerm: string = this.state.searchTerm) {
    this.fetchData(this.startIndex, 50, searchTerm);
  }

  delete = (id: string) => {
    const items = this.state.items.slice();
    const total = this.state.total || 0;
    const item = items.find(i => Number(i.id) === Number(id));
    if (item && total > 0) {
      items.splice(items.indexOf(item), 1);
      this.setState({ items, total: total - 1 });
    }
  };

  fetchNextData = () => {
    this.fetchData(this.state.lastRequestedIndex, 50);
  };

  fetchData = (
    offset: number,
    limit = 50,
    searchTerm: string = this.state.searchTerm
  ) => {
    searchTerm = searchTerm.trim();
    const { model } = this.props;
    const { items } = this.state;
    this.setState({ lastRequestedIndex: offset + limit });
    api
      .list(
        model,
        { offset, limit, q: searchTerm },
        this.createFilterCriterita()
      )
      .then(res => {
        this.setState({
          searchTerm,
          total: res.total,
          items: items.slice(0, offset).concat(res.items)
        });
      });
  };

  onRowsRendered = ({ startIndex, overscanStopIndex }: RenderInfo) => {
    this.startIndex = startIndex;
    // Lazy-load next batch of items
    if (overscanStopIndex >= this.state.lastRequestedIndex)
      this.fetchNextData();
  };

  closeFilter = () =>
    this.setState(
      {
        filterOpen: false,
        showFunc: () => true,
        filterValues: {
          field: "none",
          operation: "none",
          value: ""
        }
      },
      () => this.refresh()
    );
  openFilter = () => this.setState({ filterOpen: true });
  setFilter = values => {
    if (values.field === "none" || values.operation === "none") {
      return this.closeFilter();
    }
    this.setState(
      {
        filterOpen: false,
        filterValues: values
      },
      () => this.refresh()
    );
  };
  createFilterCriterita = () => {
    const { filterValues } = this.state;
    if (filterValues.field === "none" || filterValues.operation === "none") {
      return {};
    }

    let operation = "eq";
    let value =
      typeof filterValues.value === "object"
        ? filterValues.value.id
        : filterValues.value;
    if (filterValues.operation === ">") {
      operation = "gt";
    }
    if (filterValues.operation === "<") {
      operation = "lt";
    }
    if (filterValues.operation === ">=") {
      operation = "gte";
    }
    if (filterValues.operation === "<=") {
      operation = "lte";
    }
    if (filterValues.operation === "contains") {
      operation = "like";
      value = `%${value}%`;
    }
    return {
      [`data.${filterValues.field}`]: {
        [operation]: value
      }
    };
  };
  parseFilterValue = (fieldData, value) => {
    if (fieldData.input === "date" || fieldData.type === "date") {
      return new Date(value).toLocaleDateString();
    }
    if (fieldData.type === "boolean") {
      return value.toString();
    }
    return value;
  };

  onSearch = (e: any) => {
    e.preventDefault();
    const { searchTerm } = this.state;
    const term = e.target.elements.namedItem("searchTerm").value;
    if (!term && !searchTerm) {
      if (this.searchRef.current) {
        this.searchRef.current.focus();
      }
      return;
    }
    this.refresh(term);
  };

  render() {
    const { edit, match } = this.props;
    const { total, filterOpen, filterValues, searchTerm, items } = this.state;

    const filter = extractFilter(this.props.model);
    return (
      <>
        <FilterBar>
          {edit && (
            <Link
              {...testable("add-button")}
              className={addButtonClass}
              to={`${match.url}/edit`}
            >
              <Icon path={paths.BigPlus} />
              Add
            </Link>
          )}
          <form onSubmit={this.onSearch}>
            <InvisibleInput
              type="text"
              name="searchTerm"
              innerRef={this.searchRef}
              autoComplete="off"
              defaultValue={searchTerm}
              hasValue={!!searchTerm.trim()}
            />
            <Button
              className={modelActionButtons}
              icon={paths.Search}
              type="submit"
            />
          </form>
          {Object.keys(filter).length > 0 && (
            <Button
              className={modelActionButtons}
              icon={
                filterValues.field === "none"
                  ? paths.Filter
                  : paths.FilterRemove
              }
              type="button"
              onClick={this.openFilter}
            />
          )}
        </FilterBar>
        {filterOpen && (
          <FilterModal
            onClose={this.closeFilter}
            filter={filter}
            onSave={this.setFilter}
            initial={filterValues}
          />
        )}
        <div style={{ height: "100%", overflow: "auto" }}>
          {searchTerm || (total && total > 0) || filterValues.value ? (
            <ScrollList
              key={searchTerm}
              rowCount={total || 0}
              items={items}
              onRowsRendered={this.onRowsRendered}
              renderRow={({ key, index, style }) => {
                const item = items[index];
                if (!item) return <div style={style} />;
                return (
                  <Item
                    baseUrl={this.props.match.url}
                    {...item}
                    key={`${key}-${item.id}`}
                    index={index}
                    style={style}
                  />
                );
              }}
            />
          ) : (
            <EmptyList />
          )}
        </div>
      </>
    );
  }
}
