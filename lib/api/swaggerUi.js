"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO Factor out as stand-alone npm module
/**
 * Express middleware to serve a Swagger UI.
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const swagger_ui_dist_1 = __importDefault(require("swagger-ui-dist"));
const swaggerPath = swagger_ui_dist_1.default.absolutePath();
const serve = express_1.default.static(swaggerPath);
const indexHtml = fs_1.default.readFileSync(path_1.default.join(swaggerPath, "index.html"), "utf8");
// some inline css to hide the explorer bar
const hideExplorer = `
  .swagger-ui .topbar .download-url-wrapper { display: none }
`;
/**
 * Returns an express middleware to serve the ui for the given
 * swagger document.
 */
exports.default = (docsUrl, specUrl) => {
    // inject css and replace the petstore with the provided URL:
    const html = indexHtml
        .replace("</style>", `${hideExplorer}$&`)
        .replace("</title>", `$&<base href="${docsUrl}" />`)
        .replace("https://petstore.swagger.io/v2/swagger.json", specUrl);
    return (req, res, next) => {
        if (req.path === "/") {
            // send the tweaked html
            res.send(html);
        }
        else {
            // serve the static asset
            serve(req, res, next);
        }
    };
};
//# sourceMappingURL=swaggerUi.js.map