"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const describe_1 = __importDefault(require("./describe"));
const routes_1 = __importDefault(require("./routes"));
const acl_1 = require("./acl");
const defaultPermissions = req => ({
    preview: true,
    content: { "*": acl_1.Permission.view }
});
exports.default = (persistence, permissions = defaultPermissions, models) => {
    return {
        describe: describe_1.default,
        routes(router) {
            (0, routes_1.default)(router, persistence, permissions, models);
        }
    };
};
//# sourceMappingURL=index.js.map