"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refsMerger = exports.navigationBuilder = exports.getDocumentUrl = void 0;
var getRefUrl_1 = require("../content/getRefUrl");
Object.defineProperty(exports, "getDocumentUrl", { enumerable: true, get: function () { return __importDefault(getRefUrl_1).default; } });
var navigationBuilder_1 = require("./navigationBuilder");
Object.defineProperty(exports, "navigationBuilder", { enumerable: true, get: function () { return __importDefault(navigationBuilder_1).default; } });
var refsMerger_1 = require("./refsMerger");
Object.defineProperty(exports, "refsMerger", { enumerable: true, get: function () { return __importDefault(refsMerger_1).default; } });
//# sourceMappingURL=index.js.map