"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const probe_image_size_1 = __importDefault(require("probe-image-size"));
const file_type_1 = __importDefault(require("file-type"));
const stream_1 = require("stream");
const hasha_1 = __importDefault(require("hasha"));
const inspect = async (fileStream, filePath) => {
    const readableStream = new stream_1.Readable();
    readableStream.wrap(fileStream);
    const [pipedFileStream, hash] = await Promise.all([
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
    fileImageInfo = {
        ...fileImageInfo,
        ...pipedFileStream
    };
    if (fileImageInfo.mime.startsWith("image")) {
        const imageInfo = await (0, probe_image_size_1.default)(pipedFileStream);
        if (imageInfo.width && imageInfo.height) {
            fileImageInfo.width = imageInfo.width;
            fileImageInfo.height = imageInfo.height;
        }
    }
    return fileImageInfo;
};
exports.default = inspect;
//# sourceMappingURL=inspect.js.map