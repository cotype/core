import * as Cotype from "../../typings";
import { Permission } from "../auth/acl";
const { forbidden, view, edit, publish } = Permission;

/**
 * Model definition of the built-in settings entities.
 */
const models: Cotype.ModelOpts[] = [
  {
    name: "users",
    singular: "User",
    title: "name",
    fields: {
      name: { type: "string" },
      email: { type: "string" },
      role: { type: "settings", model: "roles" },
      picture: { type: "media" },
      newPassword: { type: "string" }
    }
  },
  {
    name: "roles",
    singular: "Role",
    fields: {
      name: { type: "string", required: true },
      permissions: {
        type: "object",
        fields: {
          settings: { type: "boolean" },
          preview: { type: "boolean", defaultValue: true },
          content: {
            type: "map",
            keys: {
              values: ["*"],
              fetch: "/info/content"
            },
            values: {
              type: "string",
              input: "select",
              values: [
                { label: "forbidden", value: forbidden },
                { label: "view", value: view },
                /* tslint:disable-next-line:no-bitwise */
                { label: "edit", value: view | edit },
                /* tslint:disable-next-line:no-bitwise */
                { label: "publish", value: view | edit | publish }
              ]
            }
          }
        }
      }
    }
  }
];

export default models;
