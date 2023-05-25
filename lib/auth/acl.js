import PermissionDeniedError from "./PermissionDeniedError";
export var Permission;
(function (Permission) {
    Permission[Permission["forbidden"] = 0] = "forbidden";
    Permission[Permission["view"] = 1] = "view";
    Permission[Permission["edit"] = 2] = "edit";
    Permission[Permission["publish"] = 4] = "publish";
})(Permission || (Permission = {}));
export function checkPermissions(principal, model, action) {
    if (!isAllowed(principal, model, action)) {
        throw new PermissionDeniedError(principal, model, action);
    }
}
export function isAllowed(principal, model, action) {
    const anonymous = !principal.id;
    switch (model.type) {
        case "media":
            return !anonymous;
        case "settings":
            return principal.permissions.settings;
        case "content":
            const rules = principal.permissions.content;
            const rule = model.name in rules ? rules[model.name] : rules["*"];
            if (!rule)
                return false;
            if (anonymous && rule > 1) {
                // Prevent access due to misconfiguration
                throw new Error("Anonymous requests must not be granted write permissions.");
            }
            /* tslint:disable-next-line:no-bitwise */
            return (rule & action) === action;
    }
    return false;
}
//# sourceMappingURL=acl.js.map