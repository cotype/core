import { Model, Principal } from "../../typings";
import HttpError from "../HttpError";
import { Permission } from "./acl";
export default class PermissionDeniedError extends HttpError {
    principal: Principal;
    model: Model;
    action: Permission;
    constructor(principal: Principal, model: Model, action: Permission);
}
