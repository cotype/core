"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_join_1 = __importDefault(require("url-join"));
function prepareSearchResults(results, models, mediaUrl) {
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
                _src: i.image ? (0, url_join_1.default)(mediaUrl, i.image) : null
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
exports.default = prepareSearchResults;
//# sourceMappingURL=prepareSearchResults.js.map