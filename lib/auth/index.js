import describe from "./describe";
import routes from "./routes";
import { Permission } from "./acl";
const defaultPermissions = req => ({
    preview: true,
    content: { "*": Permission.view }
});
export default (persistence, permissions = defaultPermissions, models) => {
    return {
        describe,
        routes(router) {
            routes(router, persistence, permissions, models);
        }
    };
};
//# sourceMappingURL=index.js.map