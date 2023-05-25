import path from "path";
import rs from "crypto-random-string";
export default class MediaStorageEngine {
    constructor(storage) {
        this.storage = storage;
    }
    generateFilename(originalname) {
        const ext = path.extname(originalname).toLowerCase();
        return `${rs({ length: 3 })}/${rs({ length: 3 })}/${rs({
            length: 10
        })}${ext}`;
    }
    async _handleFile(req, file, cb) {
        try {
            const id = this.generateFilename(file.originalname);
            const size = await this.storage.store(id, file.stream);
            cb(null, { filename: id, size });
        }
        catch (err) {
            cb(err);
        }
    }
    async _removeFile(req, file, cb) {
        try {
            await this.storage.remove(file.filename);
            cb(null);
        }
        catch (err) {
            cb(err);
        }
    }
}
//# sourceMappingURL=MediaStorageEngine.js.map