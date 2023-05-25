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
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTempRole = exports.createUser = exports.createRole = exports.login = void 0;
const tough_cookie_1 = require("tough-cookie");
function login(server, email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield server
            .post("/admin/rest/login")
            .send({
            email,
            password
        })
            .set("Accept", "application/json")
            .expect(204);
        const c = tough_cookie_1.Cookie.parse(res.header["set-cookie"][0]);
        if (!c) {
            throw new Error("Could not set session cookie");
        }
        return {
            headers: { cookie: c.cookieString() },
            server
        };
    });
}
exports.login = login;
function createRole(server, headers, name, permissions) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield server
            .post("/admin/rest/settings/roles")
            .set(headers)
            .send({
            data: {
                name,
                permissions
            }
        });
        return res.body.id;
    });
}
exports.createRole = createRole;
function createUser(server, headers, email, newPassword, role) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield server
            .post("/admin/rest/settings/users")
            .set(headers)
            .send({
            data: {
                email,
                newPassword,
                name: email,
                role
            }
        });
        return res.body.id;
    });
}
exports.createUser = createUser;
function withTempRole(server, permissions) {
    return __awaiter(this, void 0, void 0, function* () {
        const roleName = `temp-role-${Date.now()}`;
        const { headers } = yield login(server, "admin@cotype.dev", "admin");
        const roleId = yield createRole(server, headers, roleName, permissions);
        const email = `temp-user-${Date.now()}@cotype.dev`;
        const password = email;
        yield createUser(server, headers, email, password, roleId);
        return login(server, email, password);
    });
}
exports.withTempRole = withTempRole;
//# sourceMappingURL=util.js.map