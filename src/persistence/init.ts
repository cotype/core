import { Permission } from "../auth/acl";
const { view, edit, publish } = Permission;

import log from "../log";
import bcrypt from "bcryptjs";
import SettingsPersistence from "./SettingsPersistence";

export default async function(settings: SettingsPersistence) {
  const Roles = settings.getModel("roles")!;
  const Users = settings.getModel("users")!;
  const adminRole = await settings.adapter.find(Roles, "name", "admin");
  if (!adminRole) {
    log.info("Creating admin role");
    const role = await settings.adapter.create(Roles, {
      name: "admin",
      permissions: {
        settings: true,
        content: {
          /* tslint:disable-next-line:no-bitwise */
          "*": view | edit | publish
        }
      }
    });
    await settings.adapter.create(Users, {
      role,
      email: "admin@cotype.dev",
      name: "Administrator",
      password: bcrypt.hashSync("admin", 10)
    });
  }
}
