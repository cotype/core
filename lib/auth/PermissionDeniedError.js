import HttpError from "../HttpError";
import { Permission } from "./acl";
export default class PermissionDeniedError extends HttpError {
    constructor(principal, model, action) {
        super(403, `${principal.name} is not allowed to ${Permission[action]} ${model.name}`);
        this.principal = principal;
        this.model = model;
        this.action = action;
    }
}
//# sourceMappingURL=PermissionDeniedError.js.map