/// <reference types="cookie-session" />
/// <reference types="qs" />
/// <reference types="express" />
/**
 * Returns a middleware that does the session handling.
 */
declare const _default: (opts?: CookieSessionInterfaces.CookieSessionOptions) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export default _default;
