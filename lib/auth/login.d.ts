import { Request, Response, NextFunction } from "express";
/**
 * Express middleware to require a login.
 * Unauthenticated users get a 403.
 */
export default function (req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
