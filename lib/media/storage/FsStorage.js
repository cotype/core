import fs from "fs-extra";
import path from "path";
export default class FsStorage {
    constructor(uploadDir) {
        this.uploadDir = uploadDir;
        fs.mkdirsSync(uploadDir);
    }
    getFile(id) {
        const normalizedId = path.normalize(id);
        if (/^[./\/]/.test(normalizedId)) {
            throw new Error("Invalid id.");
        }
        return path.resolve(this.uploadDir, id);
    }
    store(id, stream) {
        return new Promise((resolve, reject) => {
            const file = this.getFile(id);
            fs.ensureFileSync(file);
            const out = fs.createWriteStream(file);
            stream.on("error", reject);
            out.on("error", reject);
            out.on("finish", () => resolve(out.bytesWritten));
            stream.pipe(out);
        });
    }
    retrieve(id) {
        return fs.createReadStream(this.getFile(id));
    }
    exists(id) {
        return fs.pathExists(this.getFile(id));
    }
    getUrl(id) {
        return `/media/${id}`;
    }
    remove(id) {
        return fs.remove(this.getFile(id));
    }
}
//# sourceMappingURL=FsStorage.js.map