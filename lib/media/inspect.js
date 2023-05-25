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
const probe_image_size_1 = __importDefault(require("probe-image-size"));
const file_type_1 = __importDefault(require("file-type"));
const stream_1 = require("stream");
const hasha_1 = __importDefault(require("hasha"));
const inspect = (fileStream, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const readableStream = new stream_1.Readable();
    readableStream.wrap(fileStream);
    const [pipedFileStream, hash] = yield Promise.all([
        file_type_1.default.stream(readableStream),
        hasha_1.default.fromFile(filePath, {
            algorithm: "md5"
        })
    ]);
    let fileImageInfo = {
        hash: String(hash),
        width: null,
        height: null,
        ext: null,
        mime: null
    };
    if (!pipedFileStream || !pipedFileStream.fileType) {
        return fileImageInfo;
    }
    fileImageInfo = Object.assign(Object.assign({}, fileImageInfo), pipedFileStream);
    if (fileImageInfo.mime.startsWith("image")) {
        const imageInfo = yield (0, probe_image_size_1.default)(pipedFileStream);
        if (imageInfo.width && imageInfo.height) {
            fileImageInfo.width = imageInfo.width;
            fileImageInfo.height = imageInfo.height;
        }
    }
    return fileImageInfo;
});
exports.default = inspect;
//# sourceMappingURL=inspect.js.map