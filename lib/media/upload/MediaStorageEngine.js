"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    _handleFile(req, file, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = this.generateFilename(file.originalname);
                const size = yield this.storage.store(id, file.stream);
                cb(null, { filename: id, size });
            }
            catch (err) {
                cb(err);
            }
        });
    }
    _removeFile(req, file, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.storage.remove(file.filename);
                cb(null);
            }
            catch (err) {
                cb(err);
            }
        });
    }
}
exports.default = MediaStorageEngine;
//# sourceMappingURL=MediaStorageEngine.js.map