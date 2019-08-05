import React, { Component } from "react";

import {
  CellMeasurer,
  CellMeasurerCache
} from "react-virtualized/dist/es/CellMeasurer";

import {
  Masonry,
  MasonryCellProps,
  createCellPositioner
} from "react-virtualized/dist/es/Masonry";

import { AutoSizer } from "react-virtualized/dist/es/AutoSizer";

import Image from "./Image";
import { matchMime } from "../utils/helper";

const columnWidth = 150;
const spacer = 20;

type Props = {
  count: number;
  data;
  onSelect;
  editable;
  onDelete;
  onRowsRendered: (a) => void;
  mediaFilter?: {
    mimeType?: string;
    maxSize?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
};
export default class Gallery extends Component<Props> {
  // Default sizes help Masonry decide how many images to batch-measure
  cache = new CellMeasurerCache({
    defaultHeight: columnWidth,
    defaultWidth: columnWidth,
    fixedWidth: true
  });

  masonry: Masonry | undefined;
  columnCount: number = 1;
  width: number = 200;

  cellPositioner = createCellPositioner({
    cellMeasurerCache: this.cache,
    columnCount: this.columnCount,
    columnWidth,
    spacer
  });

  cellRenderer = ({ index, key, parent, style }: MasonryCellProps) => {
    const { data, onSelect, editable, onDelete, mediaFilter } = this.props;
    const media = data[index];
    if (!media) return null;
    const disabledMedia =
      mediaFilter &&
      ((mediaFilter.mimeType &&
        !matchMime(media.mimetype, mediaFilter.mimeType)) ||
        (mediaFilter.maxSize && mediaFilter.maxSize < media.size) ||
        (mediaFilter.maxWidth && mediaFilter.maxWidth < media.width) ||
        (mediaFilter.minWidth && mediaFilter.minWidth > media.width) ||
        (mediaFilter.maxHeight && mediaFilter.maxHeight < media.height) ||
        (mediaFilter.minHeight && mediaFilter.minHeight > media.height));
    return (
      <CellMeasurer
        cache={this.cache}
        index={index}
        key={media.id}
        parent={parent}
      >
        <Image
          style={style}
          {...media}
          onSelect={() => onSelect([media])}
          onDelete={() => onDelete(media)}
          editable={editable && !disabledMedia}
          disabled={disabledMedia}
        />
      </CellMeasurer>
    );
  };

  setMasonryRef = ref => {
    this.masonry = ref;
  };

  onResize = ({ width }) => {
    this.width = width;
    this.calculateColumnCount();
    this.resetCellPositioner();
    if (this.masonry) this.masonry.recomputeCellPositions();
  };

  calculateColumnCount() {
    this.columnCount = Math.floor(this.width / (columnWidth + spacer));
  }

  resetCellPositioner() {
    this.cellPositioner.reset({
      columnCount: this.columnCount,
      columnWidth,
      spacer
    });
  }

  renderMasonry = size => {
    const { count, onRowsRendered } = this.props;
    this.calculateColumnCount();
    return (
      <Masonry
        ref={this.setMasonryRef}
        cellCount={Number(count)}
        cellMeasurerCache={this.cache}
        cellPositioner={this.cellPositioner}
        cellRenderer={this.cellRenderer}
        autoHeight={false}
        height={size.height}
        width={size.width}
        style={{ outline: "none", padding: "20px" }}
        overscanByPixels={1000}
        onCellsRendered={onRowsRendered}
      />
    );
  };

  render() {
    const { data } = this.props;
    if (!data) return null;
    return (
      <AutoSizer onResize={this.onResize} data={data}>
        {this.renderMasonry}
      </AutoSizer>
    );
  }
}
