import urlJoin from "url-join";
export default function prepareSearchResults(results, models, mediaUrl) {
    const mediaIds = [];
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
            description: i.description,
            image: {
                _id: i.image,
                _ref: "media",
                _src: i.image ? urlJoin(mediaUrl, i.image) : null
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
//# sourceMappingURL=prepareSearchResults.js.map