"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const acl_1 = require("../auth/acl");
const { view, edit, publish } = acl_1.Permission;
const log_1 = __importDefault(require("../log"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function default_1(settings) {
    const Roles = settings.getModel("roles");
    const Users = settings.getModel("users");
    const adminRole = await settings.adapter.find(Roles, "name", "admin");
    if (!adminRole) {
        log_1.default.info("Creating admin role");
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
            password: bcryptjs_1.default.hashSync("admin", 10)
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=init.js.map