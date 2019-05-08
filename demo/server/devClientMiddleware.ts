import * as path from "path";
import { RequestHandler, Request, Response, NextFunction } from "express";

/**
 * The Parcel middleware expects to be mounted top-level
 * but cotype mounts it under a prefix. To make it work
 * we reset req.url to originalUrl.
 */
function resetUrl(middleware: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.url = req.originalUrl;
    middleware(req, res, next);
  };
}

export default function getMiddleware(basePath: string = "") {
  const Bundler = require("parcel-bundler");
  const file = path.resolve(__dirname, "../../client/src/index.html");
  const options = {
    publicUrl: `${basePath}/admin`
  };
  const bundler = new Bundler(file, options);
  return resetUrl(bundler.middleware());
}
