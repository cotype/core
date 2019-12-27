import fs from "fs-extra";
import path from "path";
import Storage from "./Storage";

export default class FsStorage implements Storage {
  uploadDir: string;

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;
    fs.mkdirsSync(uploadDir);
  }

  getFile(id: string) {
    const normalizedId = path.normalize(id);
    if (/^[./\/]/.test(normalizedId)) {
      throw new Error("Invalid id.");
    }
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
