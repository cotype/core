"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class FsStorage {
    uploadDir;
    constructor(uploadDir) {
        this.uploadDir = uploadDir;
        fs_extra_1.default.mkdirsSync(uploadDir);
    }
    getFile(id) {
        const normalizedId = path_1.default.normalize(id);
        if (/^[./\/]/.test(normalizedId)) {
            throw new Error("Invalid id.");
        }
        return path_1.default.resolve(this.uploadDir, id);
    }
    store(id, stream) {
        return new Promise((resolve, reject) => {
            const file = this.getFile(id);
            fs_extra_1.default.ensureFileSync(file);
            const out = fs_extra_1.default.createWriteStream(file);
            stream.on("error", reject);
            out.on("error", reject);
            out.on("finish", () => resolve(out.bytesWritten));
            stream.pipe(out);
        });
    }
    retrieve(id) {
        return fs_extra_1.default.createReadStream(this.getFile(id));
    }
    exists(id) {
        return fs_extra_1.default.pathExists(this.getFile(id));
    }
    getUrl(id) {
        return `/media/${id}`;
    }
    remove(id) {
        return fs_extra_1.default.remove(this.getFile(id));
    }
}
exports.default = FsStorage;
//# sourceMappingURL=FsStorage.js.map