import { Request, Response, NextFunction } from "express";
/**
 * Returns an express middleware to serve the ui for the given
 * swagger document.
 */
declare const _default: (docsUrl: string, specUrl: string) => (req: Request, res: Response, next: NextFunction) => void;
export default _default;
