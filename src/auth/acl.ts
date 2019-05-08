import { Model, Principal } from "../../typings";
import PermissionDeniedError from "./PermissionDeniedError";

export enum Permission {
  "forbidden" = 0,
  "view" = 1,
  "edit" = 2,
  "publish" = 4
}

export function checkPermissions(
  principal: Principal,
  model: Model,
  action: number
) {
  if (!isAllowed(principal, model, action)) {
    throw new PermissionDeniedError(principal, model, action);
  }
}

export function isAllowed(principal: Principal, model: Model, action: number) {
  const anonymous = !principal.id;
  switch (model.type) {
    case "media":
      return !anonymous;
    case "settings":
      return principal.permissions.settings;
    case "content":
      const rules = principal.permissions.content;

      const rule = model.name in rules ? rules[model.name] : rules["*"];
      if (!rule) return false;

      if (anonymous && rule > 1) {
        // Prevent access due to misconfiguration
        throw new Error(
          "Anonymous requests must not be granted write permissions."
        );
      }

      /* tslint:disable-next-line:no-bitwise */
      return (rule & action) === action;
  }
  return false;
}
