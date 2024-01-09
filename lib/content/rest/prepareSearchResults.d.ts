import { ListChunk, Model, SearchResultItem } from "../../../typings";
export default function prepareSearchResults(results: ListChunk<SearchResultItem>, models: Model[], mediaUrl: string): {
    items: any[];
    mediaIds: string[];
};
