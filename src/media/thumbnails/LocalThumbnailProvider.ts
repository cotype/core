import fs from "fs-extra";
import tempy from "tempy";
import sharp from "sharp";
import smartcrop from "smartcrop-sharp";
import tempWrite from "temp-write";
import Storage from "../storage/Storage";
import path from "path";
import { ThumbnailProvider, ThumbnailSize } from "../../../typings";
import { formats } from "./ThumbnailProvider";

export default class LocalThumbnailProvider implements ThumbnailProvider {
  storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async getThumbUrl(id: string, format: keyof typeof formats) {
    const exists = await this.storage.exists(id);
    if (!exists) return null;

    const ext = path.extname(id);
    const dirname = path.dirname(id);
    const basename = path.basename(id, ext);

    const thumbId = `${dirname}/${basename}.thumb.${format}${ext}`;

    const url = this.storage.getUrl(thumbId);
    const thumbExists = await this.storage.exists(thumbId);
    if (thumbExists) return url;
    await this.createThumb(id, thumbId, format);
    return url;
  }

  async createThumb(id: string, thumbId: string, format: keyof typeof formats) {
    const ext = path.extname(id);
    if (ext === ".svg") {
      await this.storage.store(thumbId, this.storage.retrieve(id));
    } else {
      const tmpSrc = await tempWrite(this.storage.retrieve(id));
      const tmpDest = tempy.file();
      await this.resize(tmpSrc, tmpDest, formats[format]);
      await this.storage.store(thumbId, fs.createReadStream(tmpDest));
      await fs.remove(tmpSrc);
      await fs.remove(tmpDest);
    }
  }

  async resize(src: string, dest: string, size: ThumbnailSize) {
    const { width, height, crop } = size;
    if (crop) {
      const { topCrop } = await smartcrop.crop(src, { width, height });
      return sharp(src)
        .extract({
          width: topCrop.width,
          height: topCrop.height,
          left: topCrop.x,
          top: topCrop.y
        })
        .resize(width, height)
        .toFile(dest);
    } else {
      return sharp(src)
        .resize(width, height, { fit: "inside" })
        .toFile(dest);
    }
  }
}
