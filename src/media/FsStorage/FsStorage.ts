import fs from "fs-extra";
import path from "path";
import tempWrite from "temp-write";
import Storage from "../Storage";
import upload from "./upload";
import inspect from "./inspect";
import { RequestHandler } from "express";

function getUploadHandler(storage: Storage) {
  return (): RequestHandler[] => {
    const handler = upload(storage);

    return [
      handler,
      async (req, res) => {
        const { files: filesUpload } = req;
        const files: object[] = [];
        // const duplicates: object[] = [];

        if (!Array.isArray(filesUpload)) return res.status(500).end();

        for (const fileKey in filesUpload) {
          if (filesUpload.hasOwnProperty(fileKey)) {
            const { filename: id, originalname, mimetype, size } = filesUpload[
              fileKey
            ];

            const tmpFile = await tempWrite(storage.retrieve(id));
            const { width, height, type, hash } = await inspect(tmpFile);

            files.push({
              id,
              size,
              originalname,
              mimetype,
              imagetype: type,
              width,
              height,
              hash
            });
          }
        }
        res.json({ files });
      }
    ];
  };
}

export default class FsStorage implements Storage {
  uploadDir: string;
  upload: Storage["upload"];
  constructor(uploadDir: string) {
    this.upload = {
      dynamic: false,
      getHandler: getUploadHandler(this)
    };
    this.uploadDir = uploadDir;
    fs.mkdirsSync(uploadDir);
  }

  getFile(id: string) {
    return path.resolve(this.uploadDir, id);
  }

  store(id: string, stream: NodeJS.ReadableStream) {
    return new Promise<number>((resolve, reject) => {
      const file = this.getFile(id);
      fs.ensureFileSync(file);
      const out = fs.createWriteStream(file);
      stream.on("error", reject);
      out.on("error", reject);
      out.on("finish", () => resolve(out.bytesWritten));
      stream.pipe(out);
    });
  }

  retrieve(id: string) {
    return fs.createReadStream(this.getFile(id));
  }

  exists(id: string) {
    return fs.pathExists(this.getFile(id));
  }

  getUrl(id: string) {
    return `/media/${id}`;
  }

  remove(id: string) {
    return fs.remove(this.getFile(id));
  }
}
