import { Principal, PreviewOpts } from "./entities";

declare global {
  namespace Express {
    interface Request {
      principal: Principal;
      previewOpts?: PreviewOpts;
    }
  }
}
