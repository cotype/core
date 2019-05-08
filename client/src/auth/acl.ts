import * as Cotype from "../../../typings";
export enum Permission {
  "forbidden" = 0,
  "view" = 1,
  "edit" = 2,
  "publish" = 4
}

export function isAllowed(
  user: Cotype.Principal & Cotype.User,
  model: Cotype.Model,
  action: Permission
) {
  const { permissions } = user;

  if (!model.writable) return false;
  switch (model.type) {
    case "media":
      return true;
    case "settings":
      return permissions.settings;
    case "content":
      const rules = permissions.content;

      const rule = model.name in rules ? rules[model.name] : rules["*"];
      if (!rule) return false;

      /* tslint:disable-next-line:no-bitwise */
      return (rule & action) === action;
  }
  return false;
}
