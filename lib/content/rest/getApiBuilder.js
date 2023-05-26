"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openapi3_ts_1 = require("openapi3-ts");
const url_join_1 = __importDefault(require("url-join"));
function getApiBuilder(basePath) {
    const apiBuilder = openapi3_ts_1.OpenApiBuilder.create()
        .addServer({
        url: (0, url_join_1.default)(basePath, "rest/drafts"),
        description: "Drafted Contents"
    })
        .addServer({
        url: (0, url_join_1.default)(basePath, "rest/published"),
        description: "Published Contents"
    })
        .addResponse("notFound", {
        description: "Not found"
    });
    // Hide authorize button as we currently have no schemes
    // See: https://github.com/swagger-api/swagger-ui/issues/3314
    delete apiBuilder.rootDoc.components.securitySchemes;
    return apiBuilder;
}
exports.default = getApiBuilder;
//# sourceMappingURL=getApiBuilder.js.map