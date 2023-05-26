"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acl_1 = require("./acl");
const permissionMap = {
    contentTypes: acl_1.Permission.forbidden,
    find: acl_1.Permission.view,
    findInternal: acl_1.Permission.view,
    load: acl_1.Permission.view,
    loadInternal: acl_1.Permission.view,
    loadItem: acl_1.Permission.forbidden,
    loadRevision: acl_1.Permission.view,
    list: acl_1.Permission.forbidden,
    listVersions: acl_1.Permission.view,
    create: acl_1.Permission.edit,
    createRevision: acl_1.Permission.edit,
    update: acl_1.Permission.edit,
    delete: acl_1.Permission.edit,
    publishRevision: acl_1.Permission.publish,
    schedule: acl_1.Permission.publish
};
function withAuth(dataSource) {
    Object.entries(permissionMap).forEach(([methodName, permission]) => {
        if (permission) {
            if (dataSource[methodName]) {
                const original = dataSource[methodName];
                dataSource[methodName] = (principal, model, ...rest) => {
                    (0, acl_1.checkPermissions)(principal, model, permission);
                    return original.call(dataSource, principal, model, ...rest);
                };
            }
        }
    });
    return dataSource;
}
exports.default = withAuth;
//# sourceMappingURL=withAuth.js.map