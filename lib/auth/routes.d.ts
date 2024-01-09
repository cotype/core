import { Router, Request } from "express";
import { Persistence } from "../persistence";
import { Permissions, Models } from "../../typings";
export type AnonymousPermissions = (req: Request) => Partial<Permissions>;
/**
 * Registers the authentication routes (login/logout) as well as
 * a middleware that sets the `request.principal` property.
 */
declare const _default: (router: Router, persistence: Persistence, anonymousPermissions: AnonymousPermissions, models: Models) => Promise<void>;
export default _default;
