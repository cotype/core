/**
 * Media routes (/api/media/*)
 */
import { Router } from "express";
import { Persistence } from "../persistence";
import ReferenceConflictError from "../persistence/errors/ReferenceConflictError";
import Storage from "./Storage";
import log from "../log";
import { Meta } from "../../typings";

type Media = Meta & {
  hash: string;
};

export default function routes(
  router: Router,
  persistence: Persistence,
  storage: Storage
) {
  const { media } = persistence;
  const upload = storage.upload;

  const uploadHandler = upload.getHandler();
  if (uploadHandler) {
    router.use("/admin/rest/upload", uploadHandler);
  }

  if (upload.dynamic === true) {
    router.get("/admin/rest/upload-url", async (req, res) => {
      try {
        const url = await upload.getUploadUrl();
        res.status(200).json({ url });
      } catch (e) {
        res.status(500);
      }
    });
  }

  router.put("/admin/rest/media", async (req, res) => {
    const { principal, body } = req;

    const files = await Promise.all(
      body.map(async (file: Media) => {
        try {
          await media.create(principal, file);
          return file;
        } catch (error) {
          if (error.message.includes("UNIQUE constraint failed: media.hash")) {
            const [data] = await media.findByHash([file.hash]);
            storage.remove(file.id);
            return data;
          }
          throw error;
        }
      })
    );

    res.json(files.filter(Boolean));
  });

  router.get("/admin/rest/media", async (req, res) => {
    const { principal, query } = req;
    const { limit = 50, offset = 0, orderBy, order, search, mimetype } = query;

    const list = await media.list(principal, {
      limit,
      offset,
      orderBy,
      order,
      search,
      mimetype
    });
    res.json(list);
  });

  router.get("/admin/rest/media/*", async (req, res) => {
    const { principal, params } = req;
    const id = prepareMediaId(params[0]);

    const [data] = await media.load(principal, [id]);

    if (!data) return res.status(404).end();
    res.json(data);
  });

  router.post("/admin/rest/media/*", async (req, res) => {
    const { principal, params, body } = req;
    const id = prepareMediaId(params[0]);

    const data = await media.update(principal, id, body);

    if (data) {
      res.status(200).end();
    } else {
      res.status(400).end();
    }
  });

  router.delete("/admin/rest/media/*", async (req, res) => {
    const { principal, params } = req;
    const id = prepareMediaId(params[0]);
    try {
      await media.delete(principal, id);
      storage.remove(id);
      res.status(204).end();
    } catch (err) {
      if (err instanceof ReferenceConflictError) {
        res.status(400).json(err.refs);
      } else {
        log.error(err);
        res.status(500).end();
      }
    }
  });
}

// Remove trailing slash
function prepareMediaId(id: string) {
  return id.replace(/\/$/g, "");
}
