"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HttpError_1 = __importDefault(require("../HttpError"));
const acl_1 = require("./acl");
class PermissionDeniedError extends HttpError_1.default {
    principal;
    model;
    action;
    constructor(principal, model, action) {
        super(403, `${principal.name} is not allowed to ${acl_1.Permission[action]} ${model.name}`);
        this.principal = principal;
        this.model = model;
        this.action = action;
    }
}
exports.default = PermissionDeniedError;
//# sourceMappingURL=PermissionDeniedError.js.map