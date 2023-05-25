"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const acl_1 = require("../auth/acl");
const { view, edit, publish } = acl_1.Permission;
const log_1 = __importDefault(require("../log"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function default_1(settings) {
    return __awaiter(this, void 0, void 0, function* () {
        const Roles = settings.getModel("roles");
        const Users = settings.getModel("users");
        const adminRole = yield settings.adapter.find(Roles, "name", "admin");
        if (!adminRole) {
            log_1.default.info("Creating admin role");
            const role = yield settings.adapter.create(Roles, {
                name: "admin",
                permissions: {
                    settings: true,
                    content: {
                        /* tslint:disable-next-line:no-bitwise */
                        "*": view | edit | publish
                    }
                }
            });
            yield settings.adapter.create(Users, {
                role,
                email: "admin@cotype.dev",
                name: "Administrator",
                password: bcryptjs_1.default.hashSync("admin", 10)
            });
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=init.js.map