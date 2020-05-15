import { Router } from "express";
import describe from "./describe";
import routes, { AnonymousPermissions } from "./routes";
import { Persistence } from "../persistence";
import { Permission } from "./acl";
import { Models } from "../../typings";

const defaultPermissions: AnonymousPermissions = req => ({
  preview: true,
  content: { "*": Permission.view }
});

export { AnonymousPermissions };

export default (
  persistence: Persistence,
  permissions: AnonymousPermissions = defaultPermissions,
  models: Models
) => {
  return {
    describe,
    routes(router: Router) {
      routes(router, persistence, permissions, models);
    }
  };
};
