import { ContentWithRefs, ListChunkWithRefs, Content } from "../../../typings";
export default function pickFieldsFromResultData(unpickedData: ContentWithRefs | ListChunkWithRefs<Content>, fields: string[]): ContentWithRefs | ListChunkWithRefs<Content<import("../../../typings").Data>>;
