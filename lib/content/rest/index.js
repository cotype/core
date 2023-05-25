import createApiBuilder from "./getApiBuilder";
import routes from "./routes";
import describe from "./describe";
import swaggerUi from "../../api/swaggerUi";
import urlJoin from "url-join";
export function getApiBuilder(models, basePath) {
    const apiBuilder = createApiBuilder(basePath);
    describe(apiBuilder, models);
    return apiBuilder;
}
export default function rest(router, { persistence, models, externalDataSources, basePath, mediaUrl, responseHeaders }) {
    const apiBuilder = getApiBuilder(models, basePath);
    router.get("/rest", (req, res) => res.redirect(urlJoin(basePath, "docs/")));
    router.get("/rest/swagger.json", (req, res) => {
        res.json(apiBuilder.getSpec());
    });
    routes(router, persistence, models.content, externalDataSources, mediaUrl, responseHeaders);
    router.use("/docs", swaggerUi(urlJoin(basePath, "docs/"), urlJoin(basePath, "rest/swagger.json")));
}
//# sourceMappingURL=index.js.map