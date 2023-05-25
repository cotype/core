import routes from "./routes";
import describe from "./describe";
import graphql from "./graphql";
import rest, { getApiBuilder as getRestApiBuilder } from "./rest";
export { getRestApiBuilder };
export default (opts) => {
    return {
        describe,
        routes(router) {
            routes(router, opts);
            rest(router, opts);
            graphql(router, opts);
        }
    };
};
//# sourceMappingURL=index.js.map