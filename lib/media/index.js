"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes"));
const describe_1 = __importDefault(require("./describe"));
const FsStorage_1 = __importDefault(require("./storage/FsStorage"));
const url_join_1 = __importDefault(require("url-join"));
function media(persistence, models, storage, thumbnailProvider, basePath = "/") {
    return {
        describe(api) {
            (0, describe_1.default)(api, models.media);
        },
        routes(router) {
            (0, routes_1.default)(router, persistence, storage);
            if (storage instanceof FsStorage_1.default) {
                router.use("/media", express_1.default.static(storage.uploadDir));
            }
            router.get("/thumbs/:format/*", async (req, res) => {
                const { format } = req.params;
                const id = req.params["0"];
                try {
                    const url = await thumbnailProvider.getThumbUrl(id, format);
                    if (!url)
                        res.status(404).end();
                    else
                        res.redirect((0, url_join_1.default)(basePath, url));
                }
                catch (err) {
                    res.status(500).end();
                }
            });
        }
    };
}
exports.default = media;
//# sourceMappingURL=index.js.map