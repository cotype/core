import { Principal, PreviewOpts } from "./entities";
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      principal: Principal;
      previewOpts?: PreviewOpts;
    }
  }
}
