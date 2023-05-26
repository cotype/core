"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const MediaStorageEngine_1 = __importDefault(require("./MediaStorageEngine"));
function uploadHandler(storage) {
    const upload = (0, multer_1.default)({ storage: new MediaStorageEngine_1.default(storage) });
    return upload.array("file");
}
exports.default = uploadHandler;
//# sourceMappingURL=index.js.map