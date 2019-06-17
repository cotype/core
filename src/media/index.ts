import { Models, ThumbnailProvider } from "../../typings";
import express, { Router } from "express";
import { OpenApiBuilder } from "openapi3-ts";
import { Persistence } from "../persistence";
import routes from "./routes";
import describe from "./describe";
import Storage from "./Storage";
import FsStorage from "./FsStorage";

export default function media(
  persistence: Persistence,
  models: Models,
  storage: Storage,
  thumbnailProvider: ThumbnailProvider
) {
  return {
    describe(api: OpenApiBuilder) {
      describe(api, models.media);
    },
    routes(router: Router) {
      routes(router, persistence, storage);
      if (storage instanceof FsStorage) {
        router.use("/media", express.static(storage.uploadDir));
      }
      router.get("/thumbs/:format/*", async (req, res) => {
        const { format } = req.params;
        const id = req.params["0"];
        try {
          const url = await thumbnailProvider.getThumbUrl(id, format);
          if (!url) res.status(404).end();
          else res.redirect(url);
        } catch (err) {
          res.status(500).end();
        }
      });
    }
  };
}
