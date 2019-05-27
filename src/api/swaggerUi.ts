// TODO Factor out as stand-alone npm module
/**
 * Express middleware to serve a Swagger UI.
 */
import fs from "fs";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import swaggerUI from "swagger-ui-dist";

const swaggerPath = swaggerUI.absolutePath();
const serve = express.static(swaggerPath);
const indexHtml = fs.readFileSync(path.join(swaggerPath, "index.html"), "utf8");

// some inline css to hide the explorer bar
const hideExplorer = `
  .swagger-ui .topbar .download-url-wrapper { display: none }
`;

/**
 * Returns an express middleware to serve the ui for the given
 * swagger document.
 */
export default (docsUrl: string, specUrl: string) => {
  // inject css and replace the petstore with the provided URL:
  const html = indexHtml
    .replace("</style>", `${hideExplorer}$&`)
    .replace("</title>", `$&<base href="${docsUrl}" />`)
    .replace("https://petstore.swagger.io/v2/swagger.json", specUrl);

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/") {
      // send the tweaked html
      res.send(html);
    } else {
      // serve the static asset
      serve(req, res, next);
    }
  };
};
