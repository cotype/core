"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowed = exports.checkPermissions = exports.Permission = void 0;
const PermissionDeniedError_1 = __importDefault(require("./PermissionDeniedError"));
var Permission;
(function (Permission) {
    Permission[Permission["forbidden"] = 0] = "forbidden";
    Permission[Permission["view"] = 1] = "view";
    Permission[Permission["edit"] = 2] = "edit";
    Permission[Permission["publish"] = 4] = "publish";
})(Permission = exports.Permission || (exports.Permission = {}));
function checkPermissions(principal, model, action) {
    if (!isAllowed(principal, model, action)) {
        throw new PermissionDeniedError_1.default(principal, model, action);
    }
}
exports.checkPermissions = checkPermissions;
function isAllowed(principal, model, action) {
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
exports.isAllowed = isAllowed;
//# sourceMappingURL=acl.js.map