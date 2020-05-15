import bcrypt from "bcryptjs";
import _ from "lodash";
import { Router, Request } from "express";
import { Persistence } from "../persistence";
import { Permissions, User, Models } from "../../typings";
import { Permission, isAllowed } from "./acl";

export type AnonymousPermissions = (req: Request) => Partial<Permissions>;

/**
 * Registers the authentication routes (login/logout) as well as
 * a middleware that sets the `request.principal` property.
 */
export default async (
  router: Router,
  persistence: Persistence,
  anonymousPermissions: AnonymousPermissions,
  models: Models
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

  router.get("/admin/rest/permissions/:type", async (req, res) => {
    const { query, params } = req;
    const { sessionID } = query;
    let principal = req.principal;
    if (typeof sessionID === "string") {
      try {
        const buff = Buffer.from(sessionID, "base64");
        const session = JSON.parse(buff.toString("utf-8"));
        const userId = session.userId;
        const user = await persistence.settings.loadUser(userId);
        if (user) {
          principal = user;
        }
      } catch (e) {
        return res.status(500).json({ error: "Invalid Session" });
      }
    }
    if (!principal) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const model = models.content.find(
      m => m.name.toLowerCase() === params.type.toLowerCase()
    );
    if (!model) {
      return res.status(404).json({ error: "No such model" });
    }
    res.json({
      view: isAllowed(principal, model, Permission.view),
      edit: isAllowed(principal, model, Permission.edit),
      publish: isAllowed(principal, model, Permission.publish)
    });
  });
};
