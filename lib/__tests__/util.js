"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTempRole = exports.createUser = exports.createRole = exports.login = void 0;
const tough_cookie_1 = require("tough-cookie");
async function login(server, email, password) {
    const res = await server
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
}
exports.login = login;
async function createRole(server, headers, name, permissions) {
    const res = await server
        .post("/admin/rest/settings/roles")
        .set(headers)
        .send({
        data: {
            name,
            permissions
        }
    });
    return res.body.id;
}
exports.createRole = createRole;
async function createUser(server, headers, email, newPassword, role) {
    const res = await server
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
}
exports.createUser = createUser;
async function withTempRole(server, permissions) {
    const roleName = `temp-role-${Date.now()}`;
    const { headers } = await login(server, "admin@cotype.dev", "admin");
    const roleId = await createRole(server, headers, roleName, permissions);
    const email = `temp-user-${Date.now()}@cotype.dev`;
    const password = email;
    await createUser(server, headers, email, password, roleId);
    return login(server, email, password);
}
exports.withTempRole = withTempRole;
//# sourceMappingURL=util.js.map