import { SearchResultItem } from "./../../../typings";

export default function orderSearchResults(
  items: SearchResultItem[],
  searchTerm: string
) {
  return items.sort((a, b) => {
    const first = a.title.search(new RegExp(searchTerm, "i"));
    const second = b.title.search(new RegExp(searchTerm, "i"));

    return (
      (first === -1 ? Infinity : first) - (second === -1 ? Infinity : second)
    );
  });
}
