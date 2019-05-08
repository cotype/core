import { Opts } from "../../src";
import { Request, Response, NextFunction } from "express";

type Initializer = (newConfig: Opts) => Promise<void>;

export default function reInitMiddleware(reInit: Initializer) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "POST" && req.url === "/__reinit") {
      try {
        await reInit(req.body as Opts);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
      res.sendStatus(204);
      return;
    }
    return next();
  };
}
