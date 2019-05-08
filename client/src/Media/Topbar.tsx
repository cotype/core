import React, { Component } from "react";
import styled from "react-emotion";
import ButtonImport from "../common/Button";
import { UploadField } from "@navjobs/upload";
import Icon from "../common/icons";
import MoreButton from "../common/MoreButton";

const Root = styled("div")`
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: relative;
  background-color: #fff;
  z-index: 1;
  display: flex;
  align-items: stretch;
`;
const Filters = styled("div")`
  padding-right: 20px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  align-items: stretch;
`;

const Order = styled("div")`
  padding-left: 20px;
  padding-right: 20px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  font-size: 15px;
  font-size: 0.9375rem;
  color: var(--dark-grey);
  & button {
    padding: 0;
  }
`;

const Search = styled("div")`
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 20px;
  flex: 1;
  & > svg {
    color: var(--disabled-color);
  }
`;

const SearchInput = styled("input")`
  border: 0;
  padding-left: 40px;
  background-color: transparent;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
  border-radius: 0;
  background-image: none;
  transition: border 0.2s cubic-bezier(0.55, 0, 0.1, 1);
  font-size: 15px;
  font-size: 0.9375rem;
  :focus {
    outline: 0;
  }
`;
const Add = styled("div")`
  display: flex;
  align-items: stretch;
  padding-left: 20px;
  & > div {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

type P = {
  active?: boolean;
};
const Button = styled(ButtonImport)`
  color: var(--dark-color);
  -webkit-appearance: none;
  background-color: transparent;
  padding: 17px 20px 13px;
  border-width: 0;
  border-bottom: 4px solid transparent;
  border-radius: 0;
  border-bottom-color: ${(p: P) => p.active && "#70c8dc"};
  border-bottom-color: ${(p: P) => p.active && "var(--accent-color)"};
`;

const UploadButton = styled(Button)`
  color: #fff;
  background: var(--accent-color);
  padding: 0.7em 1em;
  border-radius: 3px;
  border-bottom: 0px;
`;

type OrderButton = {
  ascending?: boolean;
};
const OrderButton = styled("div")`
  padding-left: 20px;
  height: 24px;
  cursor: pointer;
  & > svg {
    color: var(--dark-grey);
    transform: ${({ ascending }: OrderButton) => ascending && "rotate(180deg)"};
  }
`;

type Props = {
  onFilterChange: (filter: string) => void;
  onSearch: (query: string) => void;
  onAdd: (files: any) => void;
  filters: Array<{ label: string; value: string }>;
  orderBys: Array<{ label: string; value: string }>;
  onOrderByChange: (orderBy: string) => void;
  onOrderChange: (order: string) => void;
};

type State = {
  filter: string;
  orderBy: string;
  descending: boolean;
  uploadFieldKey: number;
};
export default class Topbar extends Component<Props, State> {
  state: State = {
    filter: "",
    orderBy: "Date",
    descending: true,
    uploadFieldKey: 0
  };

  constructor(props: Props) {
    super(props);
    if (props.filters && props.filters[0]) {
      this.state.filter = props.filters[0].label;
    }
  }

  render() {
    const {
      filters,
      onFilterChange,
      onSearch,
      onAdd,
      orderBys,
      onOrderByChange,
      onOrderChange
    } = this.props;
    const { filter, orderBy, descending, uploadFieldKey } = this.state;
    return (
      <Root>
        <Filters>
          {filters &&
            filters.map((f, idx) => (
              <Button
                active={f.label === filter}
                key={idx}
                onClick={() => {
                  this.setState({ filter: f.label });
                  onFilterChange(f.value);
                }}
              >
                {f.label}
              </Button>
            ))}
        </Filters>
        <Order>
          Orderd by: <span style={{ paddingLeft: "8px" }}>{orderBy}</span>
          <MoreButton
            actions={orderBys.map(o => ({
              label: o.label,
              onClick: () => {
                this.setState({ orderBy: o.label });
                onOrderByChange(o.value);
              }
            }))}
            icon={<Icon.Down />}
          />
          <OrderButton
            ascending={!descending}
            onClick={() => {
              onOrderChange(!descending ? "desc" : "asc");
              this.setState((prevState: State) => ({
                descending: !prevState.descending
              }));
            }}
          >
            <Icon.Descending />
          </OrderButton>
        </Order>
        <Search>
          <Icon.Search />
          <SearchInput
            onChange={e => {
              onSearch(e.target.value);
            }}
            placeholder="Filter results..."
          />
        </Search>
        <div style={{ flex: 1 }} />
        <Add>
          <UploadField
            key={uploadFieldKey}
            onFiles={e => {
              onAdd(e);
              // set new key in order to render new input field, otherwise
              // onFiles is not called when trying to upload the same file twice
              this.setState({ uploadFieldKey: new Date().getTime() });
            }}
            uploadProps={{ multiple: true }}
          >
            <UploadButton>Upload New</UploadButton>
          </UploadField>
        </Add>
      </Root>
    );
  }
}
