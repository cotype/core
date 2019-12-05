import React, { useState, useEffect } from "react";
import styled from "styled-components/macro";
import ButtonImport from "../common/Button";
import Icon from "../common/icons";
import MoreButton from "../common/MoreButton";
import UploadField from "./UploadField";
import { useUpload } from "react-use-upload";

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

const IconBox = styled("div")`
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
  border-bottom-color: ${(p: P) => p.active && "var(--accent-color)"};
  :hover {
    color: #fff;
  }
`;

const UploadButton = styled(ButtonImport)`
  -webkit-appearance: none;
  border-width: 0;
  :hover {
    color: #fff;
  }
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
  padding-right: 20px;
  height: 24px;
  cursor: pointer;
  & > svg {
    color: var(--dark-grey);
    transform: ${({ ascending }: OrderButton) => ascending && "rotate(180deg)"};
  }
`;

export type Props = {
  onFilterChange: (filter: string) => void;
  onSearch: (query: string) => void;
  filters: Array<{ label: string; value: string }>;
  orderBys: Array<{ label: string; value: string }>;
  onOrderByChange: (orderBy: string) => void;
  onOrderChange: (order: string) => void;
  onUnUsedChange: (unUsed: boolean) => void;
  onUpload: any;
  onUploadProgress: (progress: number) => void;
};

export default function Topbar(props: Props) {
  const [filter, setFilter] = useState(props.filters[0].label);
  const [unUsed, setUnUsed] = useState(false);
  const [orderBy, setOrderBy] = useState("Date");
  const [descending, setDescending] = useState(true);
  const [uploadFieldKey, setUploadFieldKey] = useState(0);
  const [files, setFiles] = useState<FileList>();
  const { onUpload, onUploadProgress } = props;
  const { done, response, progress } = useUpload(files as any, {
    path: "/upload",
    name: "file",
    withCredentials: true
  });

  useEffect(() => {
    if (!progress) return;
    onUploadProgress(progress || 0);
  }, [progress, onUploadProgress]);

  useEffect(() => {
    if (!done) return;
    onUpload(response.response);
  }, [done, response, onUpload]);

  const {
    filters,
    onFilterChange,
    onSearch,
    orderBys,
    onOrderByChange,
    onOrderChange,
    onUnUsedChange
  } = props;

  return (
    <Root>
      <Filters>
        {filters &&
          filters.map((f, idx) => (
            <Button
              active={f.label === filter}
              key={idx}
              onClick={() => {
                setFilter(f.label);
                onFilterChange(f.value);
              }}
            >
              {f.label}
            </Button>
          ))}
      </Filters>
      <IconBox>
        <MoreButton
          actions={orderBys.map(o => ({
            label: "Orderd by: " + o.label,
            active: orderBy === o.label,
            onClick: () => {
              setOrderBy(o.label);
              onOrderByChange(o.value);
            }
          }))}
          icon={<Icon.SortAlphabetical />}
        />
        <OrderButton
          ascending={!descending}
          onClick={() => {
            onOrderChange(!descending ? "desc" : "asc");
            setDescending(!descending);
          }}
        >
          <Icon.Descending />
        </OrderButton>
        <MoreButton
          actions={[
            {
              label: "Show all documents",
              onClick: () => {
                onUnUsedChange(false);
                setUnUsed(false);
              },
              active: !unUsed
            },
            {
              label: "Show unused documents",
              onClick: () => {
                onUnUsedChange(true);
                setUnUsed(true);
              },
              active: unUsed
            }
          ]}
          icon={unUsed ? <Icon.FilterRemove /> : <Icon.Filter />}
        />
      </IconBox>
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
            setFiles(e);
            // set new key in order to render new input field, otherwise
            // onFiles is not called when trying to upload the same file twice
            setUploadFieldKey(Date.now());
          }}
          multiple
        >
          <UploadButton>Upload New</UploadButton>
        </UploadField>
      </Add>
    </Root>
  );
}
