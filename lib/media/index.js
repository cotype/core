import express from "express";
import routes from "./routes";
import describe from "./describe";
import FsStorage from "./storage/FsStorage";
import urlJoin from "url-join";
export default function media(persistence, models, storage, thumbnailProvider, basePath = "/") {
    return {
        describe(api) {
            describe(api, models.media);
        },
        routes(router) {
            routes(router, persistence, storage);
            if (storage instanceof FsStorage) {
                router.use("/media", express.static(storage.uploadDir));
            }
            router.get("/thumbs/:format/*", async (req, res) => {
                const { format } = req.params;
                const id = req.params["0"];
                try {
                    const url = await thumbnailProvider.getThumbUrl(id, format);
                    if (!url)
                        res.status(404).end();
                    else
                        res.redirect(urlJoin(basePath, url));
                }
                catch (err) {
                    res.status(500).end();
                }
            });
        }
    };
}
//# sourceMappingURL=index.js.map