import bcrypt from "bcryptjs";
import _ from "lodash";
import { Router } from "express";
import { Persistence } from "../persistence";
import { Permissions, User } from "../../typings";

export type AnonymousPermissions = (req: Request) => Partial<Permissions>;

/**
 * Registers the authentication routes (login/logout) as well as
 * a middleware that sets the `request.principal` property.
 */
export default async (
  router: Router,
  persistence: Persistence,
  anonymousPermissions: AnonymousPermissions
) => {
  const { settings } = persistence;
  router.post(`/admin/rest/login`, async (req: any, res) => {
    const { email, password } = req.body;
    const user = await settings.findUserByEmail(email);
    if (!user) return res.status(403).end();
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(403).end();
    if (!req.session) throw new Error("No session middleware");
    req.session.userId = String(user.id);
    res.status(204).end();
  });

  router.use(async (req: any, res, next) => {
    let user: null | User = null;
    if (req.session) {
      const { userId } = req.session;
      if (userId) {
        user = await settings.loadUser(userId);
        if (user) {
          // Keep the session alive. See:
          // https://github.com/expressjs/cookie-session#extending-the-session-expiration
          req.session.timestamp = Math.floor(Date.now() / 60000);
        }
      }
    }
    req.principal = user || {
      permissions: anonymousPermissions(req)
    };
    next();
  });

  router.post(`/admin/rest/logout`, async (req: any, res) => {
    req.session = undefined;
    res.status(204).end();
  });
};
