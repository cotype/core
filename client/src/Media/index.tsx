import * as Cotype from "../../../typings";
import React, { Component } from "react";
import styled from "styled-components/macro";
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
const DuplicateDialog = styled("div")`
  width: 50vw;
  height: 50vh;
  max-height: 50vw;
`;

const Main = styled("div")`
  flex: 1;
  user-select: none;
`;

const ACTIVE_CLASS = "activeClass-UploadZone";
const StyledUploadZone = styled(UploadZone)`
  flex: 1;
  display: flex;
  flex-direction: column;
  &.${ACTIVE_CLASS} {
    background: var(--light-color);
  }
`;

const FilterTypes = [
  { label: "All", value: "all" },
  { label: "Images", value: "image/" },
  { label: "Videos", value: "video/" },
  { label: "PDF", value: "application/pdf" }
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
  duplicates: Cotype.MediaType[] | null;
  fileType?: string;
  orderBy?: string;
  order?: string;
  search?: string;
  filters: { label: string; value: string }[];
  topbarProgress: number | undefined;
  unUsed: boolean;
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
    duplicates: null,
    editable: false,
    orderBy: "created_at",
    order: "desc",
    filters: FilterTypes,
    topbarProgress: undefined,
    unUsed: false
  };

  constructor(props: Props) {
    super(props);
    if (!props.onSelect) {
      this.state.editable = true;
    }
    if (
      props.mediaType &&
      typeof props.mediaType === "string" &&
      props.mediaType !== "all"
    ) {
      this.state.filters = this.state.filters.filter(el =>
        el.value.includes(props.mediaType as string)
      );
      if (this.state.filters.length > 0) {
        this.state.fileType = this.state.filters[0].value;
      }
    }
  }

  componentDidMount() {
    this.fetchNextData();
  }

  fetchNextData = () => {
    this.fetchData(this.state.lastRequestedIndex, 100);
  };

  fetchData = (offset: number, limit = 100) => {
    const { fileType, order, orderBy, search, items, unUsed } = this.state;

    this.setState({ lastRequestedIndex: offset + limit });

    const query = {
      mimetype: fileType,
      order,
      orderBy,
      search,
      offset,
      limit,
      unUsed: unUsed ? true : undefined
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
    if (confirm("Are you sure u want to delete the media?")) {
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
    }
  };

  onUpload = (res: { files: MediaType[]; duplicates: MediaType[] }) => {
    this.fetchData(0);
    if (res.duplicates.length) {
      this.setState({ duplicates: res.duplicates });
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
  onUnUsedChange = (unUsed: boolean) => {
    this.setState({ unUsed, lastRequestedIndex: 0 }, this.fetchNextData);
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

  renderDuplicatesDialog() {
    const { duplicates } = this.state;
    if (duplicates === null) return null;
    return (
      <ModalDialog
        title={"One or more files you tried to upload already exist."}
        onClose={() => this.setState({ duplicates: null })}
      >
        <DuplicateDialog>
          <Gallery
            count={duplicates.length}
            data={duplicates}
            editable={false}
            onSelect={undefined}
            onDelete={undefined}
            onRowsRendered={() => undefined}
          />
        </DuplicateDialog>
      </ModalDialog>
    );
  }

  shouldComponentUpdate(nextProps, nextState) {
    return Object.entries(nextState).some(([k, v]) => v !== this.state[k]);
  }
  render() {
    const { details, conflictingItems, filters } = this.state;
    return (
      <Root
        {...testable("upload-zone")}
        onClick={e => {
          e.stopPropagation();
        }}
      >
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
        {this.renderDuplicatesDialog()}
        {details && (
          <Details
            onClose={this.closeDetails}
            data={details}
            fetchMediaItem={this.fetchMediaItem}
          />
        )}
        <Topbar
          onUpload={this.onUpload}
          onUploadProgress={progress =>
            this.setState({ topbarProgress: progress })
          }
          filters={filters}
          onFilterChange={this.onFilterChange}
          onOrderByChange={this.onOrderByChange}
          onUnUsedChange={this.onUnUsedChange}
          onSearch={this.onSearch}
          orderBys={OrderByTypes}
          onOrderChange={this.onOrderChange}
        />
        <StyledUploadZone
          activeClass={ACTIVE_CLASS}
          onUpload={this.onUpload}
          render={({ progress }: any) => {
            const { total, items, editable, topbarProgress } = this.state;
            const isProgress =
              (progress && progress < 100) ||
              (topbarProgress && topbarProgress < 100);
            const itemCount = isProgress ? total + 1 : total;
            const data = isProgress
              ? [
                  {
                    progress:
                      progress && progress < 100 ? progress : topbarProgress
                  },
                  ...items
                ]
              : items;
            return (
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
            );
          }}
        />
      </Root>
    );
  }
}
