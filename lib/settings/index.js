"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = __importDefault(require("./routes"));
const describe_1 = __importDefault(require("./describe"));
const login_1 = __importDefault(require("../auth/login"));
exports.default = (persistence, models) => {
    return {
        describe(api) {
            models.settings.forEach(m => (0, describe_1.default)(api, m));
        },
        routes(router) {
            router.use("/admin/rest/settings", login_1.default);
            models.settings.forEach(m => (0, routes_1.default)(router, persistence, m));
        }
    };
};
//# sourceMappingURL=index.js.map