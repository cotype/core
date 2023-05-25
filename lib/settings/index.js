import routes from "./routes";
import describe from "./describe";
import login from "../auth/login";
export default (persistence, models) => {
    return {
        describe(api) {
            models.settings.forEach(m => describe(api, m));
        },
        routes(router) {
            router.use("/admin/rest/settings", login);
            models.settings.forEach(m => routes(router, persistence, m));
        }
    };
};
//# sourceMappingURL=index.js.map