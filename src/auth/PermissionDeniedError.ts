import { Model, Principal } from "../../typings";
import HttpError from "../HttpError";
import { Permission } from "./acl";
export default class PermissionDeniedError extends HttpError {
  principal: Principal;
  model: Model;
  action: Permission;

  constructor(principal: Principal, model: Model, action: Permission) {
    super(
      403,
      `${principal.name} is not allowed to ${Permission[action]} ${model.name}`
    );
    this.principal = principal;
    this.model = model;
    this.action = action;
  }
}
