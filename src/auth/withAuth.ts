import { DataSource, VersionedDataSource } from "../../typings";
import { checkPermissions, Permission } from "./acl";

type PermissionMap = { [key in keyof VersionedDataSource]: Permission };

type GenericMap = {
  [key: string]: any;
};

const permissionMap: PermissionMap = {
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

export default function withAuth(dataSource: GenericMap): DataSource {
  Object.entries(permissionMap).forEach(([methodName, permission]) => {
    if (permission) {
      if (dataSource[methodName]) {
        const original = dataSource[methodName];
        dataSource[methodName] = (
          principal: any,
          model: any,
          ...rest: any[]
        ) => {
          checkPermissions(principal, model, permission);
          return original.call(dataSource, principal, model, ...rest);
        };
      }
    }
  });

  return dataSource as DataSource;
}
