"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiBuilder = void 0;
const getApiBuilder_1 = __importDefault(require("./getApiBuilder"));
const routes_1 = __importDefault(require("./routes"));
const describe_1 = __importDefault(require("./describe"));
const swaggerUi_1 = __importDefault(require("../../api/swaggerUi"));
const url_join_1 = __importDefault(require("url-join"));
function getApiBuilder(models, basePath) {
    const apiBuilder = (0, getApiBuilder_1.default)(basePath);
    (0, describe_1.default)(apiBuilder, models);
    return apiBuilder;
}
exports.getApiBuilder = getApiBuilder;
function rest(router, { persistence, models, externalDataSources, basePath, mediaUrl, responseHeaders }) {
    const apiBuilder = getApiBuilder(models, basePath);
    router.get("/rest", (req, res) => res.redirect((0, url_join_1.default)(basePath, "docs/")));
    router.get("/rest/swagger.json", (req, res) => {
        res.json(apiBuilder.getSpec());
    });
    (0, routes_1.default)(router, persistence, models.content, externalDataSources, mediaUrl, responseHeaders);
    router.use("/docs", (0, swaggerUi_1.default)((0, url_join_1.default)(basePath, "docs/"), (0, url_join_1.default)(basePath, "rest/swagger.json")));
}
exports.default = rest;
//# sourceMappingURL=index.js.map