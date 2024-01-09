"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const crypto_random_string_1 = __importDefault(require("crypto-random-string"));
class MediaStorageEngine {
    constructor(storage) {
        this.storage = storage;
    }
    generateFilename(originalname) {
        const ext = path_1.default.extname(originalname).toLowerCase();
        return `${(0, crypto_random_string_1.default)({ length: 3 })}/${(0, crypto_random_string_1.default)({ length: 3 })}/${(0, crypto_random_string_1.default)({
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
exports.default = MediaStorageEngine;
//# sourceMappingURL=MediaStorageEngine.js.map