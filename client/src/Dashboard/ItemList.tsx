import React, { useEffect, useState } from "react";
import Item from "./Item";
import ScrollList, { RenderInfo } from "../common/ScrollList";
import ResultItem from "../common/ResultItem";
import { SearchResultItem } from "../../../typings";
import NothingFound from "./NothingFound";

const LIMIT = 50;

type Result = {
  total: number;
  items: SearchResultItem[];
};

type Props = {
  fetchItems: (offset: number, limit: number) => Promise<Result>;
  noResultText?: string;
};
export default function ItemList({ fetchItems, noResultText }: Props) {
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<null | Result>(null);

  useEffect(() => {
    let canceled = false;
    const fetchData = async () => {
      const fetchedItems = await fetchItems(offset, LIMIT);
      const { items: i, total: t } = fetchedItems;
      if (!canceled) {
        setItems({ total: t, items: items ? items.items.concat(i) : i });
      }
    };
    fetchData();

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const onRowsRendered = ({ overscanStopIndex }: RenderInfo) => {
    // Lazy-load next batch of items
    if (overscanStopIndex >= offset + LIMIT) setOffset(offset + LIMIT);
  };

  if (!items) return null;

  const { total, items: entries } = items;
  return total > 0 ? (
    <ScrollList
      rowCount={total || 0}
      items={entries}
      visibleRows={8}
      onRowsRendered={onRowsRendered}
      renderRow={({ key, index, style }) => {
        const item = entries[index];
        if (!item) return <div style={style} />;
        return (
          <Item style={style}>
            <ResultItem key={`${key}-${item.id}`} item={item} />
          </Item>
        );
      }}
    />
  ) : (
    <NothingFound text={noResultText || ""}></NothingFound>
  );
}
