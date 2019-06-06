import { Permission } from "../auth/acl";
const { view, edit, publish } = Permission;

import log from '../log';
import bcrypt from "bcryptjs";
import SettingsPersistence from "./SettingsPersistence";
import ContentPersistence from "./ContentPersistence";
import { Models } from "../../typings";
// import ReferenceConflictError from "./ReferenceConflictError";

export default async function(
  settings: SettingsPersistence,
  contents: ContentPersistence,
  models: Models
) {
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
  // TODO find a solution for initializing singletons on server startup
  // const singletonModels = models.content.filter(
  //   m => m.collection === "singleton"
  // );
  // if (singletonModels.length) {
  //   singletonModels.forEach(async model => {
  //     const { total } = await contents.adapter.find(model, {});
  //     if (!total) {
  //       const id = await contents.adapter.create(
  //         model,
  //         {},
  //         "1",
  //         models.content
  //       );
  //       if (!(id instanceof ReferenceConflictError)) {
  //         await contents.adapter.setPublishedRev(
  //           model,
  //           id as string,
  //           1,
  //           models.content
  //         );
  //       }
  //     }
  //   });
  // }
}
