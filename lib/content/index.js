"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestApiBuilder = void 0;
const routes_1 = __importDefault(require("./routes"));
const describe_1 = __importDefault(require("./describe"));
const graphql_1 = __importDefault(require("./graphql"));
const rest_1 = __importStar(require("./rest"));
Object.defineProperty(exports, "getRestApiBuilder", { enumerable: true, get: function () { return rest_1.getApiBuilder; } });
exports.default = (opts) => {
    return {
        describe: describe_1.default,
        routes(router) {
            (0, routes_1.default)(router, opts);
            (0, rest_1.default)(router, opts);
            (0, graphql_1.default)(router, opts);
        }
    };
};
//# sourceMappingURL=index.js.map