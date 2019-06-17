import * as Cotype from "../../../typings";
import React, { Component, Fragment } from "react";
import styled, { css } from "react-emotion";
import { RenderInfo } from "../common/ScrollList";
import api from "../api";
import UploadZone from "./UploadZone";
import Gallery from "./Gallery";
import Details from "./Details";
import ConflictDialog from "../common/ConflictDialog";
import Topbar from "./Topbar";
import { MediaType } from "../../../typings";
import ModalDialog from "../common/ModalDialog";
import { testable } from "../utils/helper";

const Root = styled("div")`
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
`;
const Main = styled("div")`
  flex: 1;
  user-select: none;
`;

const className = css`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const activeClass = css`
  background: var(--light-color);
`;

const FilterTypes = [
  { label: "All", value: "all" },
  { label: "Images", value: "image" },
  { label: "Videos", value: "video" },
  { label: "PDF", value: "pdf" }
];

const OrderByTypes = [
  { label: "Date", value: "created_at" },
  { label: "Size", value: "size" },
  { label: "Name", value: "originalname" }
];

type State = {
  items: Cotype.Media[];
  details: object | any;
  total: number;
  lastRequestedIndex: number;
  editable: boolean;
  conflictingItems: object[] | any;
  fileType?: string;
  orderBy?: string;
  order?: string;
  search?: string;
  filters: Array<{ label: string; value: string }>;
};
type Props = {
  model?: object;
  onSelect?: (ev: any) => void;
  openFromInput?: boolean;
  mediaType?: string;
  mediaFilter?: {
    mimeType?: string;
    maxSize?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
};

export default class Media extends Component<Props, State> {
  state: State = {
    total: 0,
    items: [],
    lastRequestedIndex: 0,
    details: null,
    conflictingItems: null,
    editable: false,
    orderBy: "created_at",
    order: "desc",
    filters: FilterTypes
  };

  constructor(props: Props) {
    super(props);
    if (!props.onSelect) {
      this.state.editable = true;
    }
    if (props.mediaType && props.mediaType !== "all") {
      this.state.filters = this.state.filters.filter(
        el => el.value === props.mediaType
      );
      this.state.fileType = this.state.filters[0].value;
    }
  }

  componentDidMount() {
    this.fetchNextData();
  }

  fetchNextData = () => {
    this.fetchData(this.state.lastRequestedIndex, 50);
  };

  fetchData = (offset: number, limit = 50) => {
    const { fileType, order, orderBy, search, items } = this.state;

    this.setState({ lastRequestedIndex: offset + limit });

    const query = {
      mimetype: fileType,
      order,
      orderBy,
      search,
      offset,
      limit
    };
    api.listMedia(query).then(res =>
      this.setState({
        total: res.total,
        items: items.slice(0, offset).concat(res.items)
      })
    );
  };

  onRowsRendered = ({ stopIndex }: RenderInfo) => {
    // Lazy-load next batch of items
    if (stopIndex >= this.state.lastRequestedIndex) this.fetchNextData();
  };

  fetchMediaItem = (media: Cotype.Media) => {
    api.loadMedia(media.id).then(res => {
      this.setState((prevState: State) => {
        const newItems = prevState.items.map(i => (i.id === res.id ? res : i));
        return { items: newItems };
      });
    });
  };

  /**
   * @description Delete file if possible, otherwise show conflict dialog
   */
  deleteMedia = (media: Cotype.Media) => {
    api
      .deleteMedia(media.id)
      .then(res => {
        const { items: curItems } = this.state;
        if (Array.isArray(curItems)) {
          const items = curItems.slice();
          items.splice(items.indexOf(media), 1);
          this.setState({ items, details: null });
        }
      })
      .catch(err => {
        if (err.status === 400)
          this.setState({ conflictingItems: err.body, details: null });
      });
  };

  onUpload = (files: MediaType[]) => {
    if (files.length) {
      this.fetchData(0);
    }
  };

  onSelect = (media: object) => {
    const { onSelect } = this.props;
    if (onSelect) {
      onSelect(media);
    } else {
      this.setState({ details: media });
    }
  };

  onFilterChange = (type: string) => {
    const { fileType } = this.state;
    if (fileType === type) return;
    if (type === "all") {
      this.setState(
        { fileType: undefined, lastRequestedIndex: 0 },
        this.fetchNextData
      );
    } else {
      this.setState(
        { fileType: type, lastRequestedIndex: 0 },
        this.fetchNextData
      );
    }
  };

  onOrderByChange = (orderBy: string) => {
    this.setState({ orderBy, lastRequestedIndex: 0 }, this.fetchNextData);
  };
  onOrderChange = (order: string) => {
    this.setState({ order, lastRequestedIndex: 0 }, this.fetchNextData);
  };

  onSearch = (search: string) => {
    this.setState({ search, lastRequestedIndex: 0 }, this.fetchNextData);
  };

  closeDetails = () => {
    this.setState({ details: null });
  };

  closeConflict = () => {
    this.setState({ conflictingItems: null });
  };

  render() {
    const {
      total,
      items,
      details,
      editable,
      conflictingItems,
      filters
    } = this.state;
    return (
      <Root {...testable("upload-zone")}>
        {conflictingItems && (
          <ConflictDialog
            onClose={this.closeConflict}
            items={conflictingItems}
            type="media"
            title="File in use"
            description="The file you're trying to delete is still in use. Please remove or
            replace the file in following locations:"
          />
        )}
        {details && (
          <Details
            onClose={this.closeDetails}
            data={details}
            fetchMediaItem={this.fetchMediaItem}
          />
        )}
        <UploadZone
          className={className}
          activeClass={activeClass}
          onUpload={this.onUpload}
          render={({ progress, complete, onFiles }: any) => {
            const itemCount = progress && !complete ? total + 1 : total;
            const data =
              progress && !complete ? [{ progress }, ...items] : items;
            return (
              <Fragment>
                <Topbar
                  onAdd={onFiles}
                  filters={filters}
                  onFilterChange={this.onFilterChange}
                  onOrderByChange={this.onOrderByChange}
                  onSearch={this.onSearch}
                  orderBys={OrderByTypes}
                  onOrderChange={this.onOrderChange}
                />
                <Main>
                  <Gallery
                    count={itemCount}
                    data={data}
                    editable={editable}
                    onSelect={this.onSelect}
                    onDelete={this.deleteMedia}
                    onRowsRendered={this.onRowsRendered}
                    mediaFilter={this.props.mediaFilter}
                  />
                </Main>
              </Fragment>
            );
          }}
        />
      </Root>
    );
  }
}
