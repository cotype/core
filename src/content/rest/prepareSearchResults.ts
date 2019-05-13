import { ListChunk, Model, SearchResultItem, BaseUrls } from "../../../typings";

export default function(
  results: ListChunk<SearchResultItem>,
  models: Model[],
  baseUrls?: BaseUrls
): { items: any[]; mediaIds: string[] } {
  const mediaIds: string[] = [];
  const items = results.items
    .map(i => {
      const model = models.find(m => m.name === i.model);

      if (!model || model.notSearchAble) {
        return null;
      }
      if (i.image) {
        mediaIds.push(i.image);
      }
      return {
        id: i.id,
        image: {
          _id: i.image,
          _ref: "media",
          _src: i.image
            ? `${baseUrls && baseUrls.media ? baseUrls.media : "/media/"}${
                i.image
              }`
            : null
        },
        title: i.title,
        url: i.url
      };
    })
    .filter(Boolean);

  return {
    items,
    mediaIds
  };
}
