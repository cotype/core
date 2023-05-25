import { checkPermissions, Permission } from "./acl";
const permissionMap = {
    contentTypes: Permission.forbidden,
    find: Permission.view,
    findInternal: Permission.view,
    load: Permission.view,
    loadInternal: Permission.view,
    loadItem: Permission.forbidden,
    loadRevision: Permission.view,
    list: Permission.forbidden,
    listVersions: Permission.view,
    create: Permission.edit,
    createRevision: Permission.edit,
    update: Permission.edit,
    delete: Permission.edit,
    publishRevision: Permission.publish,
    schedule: Permission.publish
};
export default function withAuth(dataSource) {
    Object.entries(permissionMap).forEach(([methodName, permission]) => {
        if (permission) {
            if (dataSource[methodName]) {
                const original = dataSource[methodName];
                dataSource[methodName] = (principal, model, ...rest) => {
                    checkPermissions(principal, model, permission);
                    return original.call(dataSource, principal, model, ...rest);
                };
            }
        }
    });
    return dataSource;
}
//# sourceMappingURL=withAuth.js.map