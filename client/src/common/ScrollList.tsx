import React, { Component } from "react";
import { AutoSizer } from "react-virtualized/dist/es/AutoSizer";
import { List, ListProps, ListRowProps } from "react-virtualized/dist/es/List";
import {
  CellMeasurer,
  CellMeasurerCache
} from "react-virtualized/dist/es/CellMeasurer";

const defaultHeight = 80;

type Size = { width: number; height: number };

export type RenderInfo = {
  overscanStartIndex: number;
  overscanStopIndex: number;
  startIndex: number;
  stopIndex: number;
};

export type Props = Partial<ListProps> & {
  rowCount: number;
  renderRow: (foo: any) => React.ReactNode;
  visibleRows?: number;
  size?: Size;
  className?: string;
  extraPadding?: number;
};
type State = {
  rowHeight: number;
};
export default class ScrollList extends Component<Props, State> {
  state: State = {
    rowHeight: defaultHeight
  };

  list: List | undefined;

  cache = new CellMeasurerCache({
    defaultHeight,
    fixedWidth: true,
    keyMapper: () => 1
  });

  setList = (list: List) => {
    this.list = list;
  };

  rowRenderer = ({ key, parent, ...props }: ListRowProps) => (
    <CellMeasurer
      cache={this.cache}
      columnIndex={0}
      key={key}
      parent={parent}
      rowIndex={props.index}
    >
      {this.props.renderRow(props)}
    </CellMeasurer>
  );

  onRowsRendered = (info: RenderInfo) => {
    if (this.props.visibleRows && this.state.rowHeight === defaultHeight) {
      const rowHeight = this.cache.rowHeight({ index: 0 });
      if (rowHeight !== defaultHeight) this.setState({ rowHeight });
    }
    const { onRowsRendered } = this.props;
    if (onRowsRendered) onRowsRendered(info);
  };

  renderList(size: Size, className?: string) {
    const { rowCount, ...props } = this.props;
    return (
      <List
        {...props}
        ref={this.setList}
        width={size.width}
        height={size.height}
        deferredMeasurementCache={this.cache}
        rowHeight={this.cache.rowHeight}
        overscanRowCount={10}
        rowCount={rowCount}
        rowRenderer={this.rowRenderer}
        onRowsRendered={this.onRowsRendered}
        className={className}
      />
    );
  }

  render() {
    const {
      rowCount = 0,
      visibleRows,
      size,
      className,
      extraPadding = 0
    } = this.props;
    if (size) {
      // Size passed as prop (possibly from another AutoSizer)
      return this.renderList(size, className);
    }
    if (visibleRows) {
      // Let height be a multiple of the row height
      const { rowHeight = defaultHeight } = this.state;
      const rows = Math.min(rowCount, visibleRows);
      return (
        <AutoSizer disableHeight>
          {({ width }) =>
            this.renderList(
              {
                width,
                height: rows * rowHeight + extraPadding
              },
              className
            )
          }
        </AutoSizer>
      );
    }
    return <AutoSizer>{size2 => this.renderList(size2, className)}</AutoSizer>;
  }
}
