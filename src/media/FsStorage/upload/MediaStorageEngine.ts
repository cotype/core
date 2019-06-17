import path from "path";
import { StorageEngine } from "multer";
import rs from "crypto-random-string";
import Storage from "../../Storage";

export default class MediaStorageEngine implements StorageEngine {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  generateFilename(originalname: string) {
    const ext = path.extname(originalname).toLowerCase();
    return `${rs({ length: 3 })}/${rs({ length: 3 })}/${rs({
      length: 10
    })}${ext}`;
  }

  async _handleFile(
    req: Express.Request,
    file: any,
    cb: (error?: any, info?: any) => void
  ) {
    try {
      const id = this.generateFilename(file.originalname);
      const size = await this.storage.store(id, file.stream);
      cb(null, { filename: id, size });
    } catch (err) {
      cb(err);
    }
  }

  async _removeFile(
    req: Express.Request,
    file: Express.Multer.File,
    cb: (err: any) => void
  ) {
    try {
      await this.storage.remove(file.filename);
      cb(null);
    } catch (err) {
      cb(err);
    }
  }
}
