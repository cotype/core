import path from "path";
import tempy from "tempy";
import fs from "fs-extra";
import request from "supertest";
import { init, knexAdapter } from "..";
import models from "./models";
import { login, withTempRole } from "./util";
import { Permission } from "../auth/acl";
import FsStorage from "../media/storage/FsStorage";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";
import { createApiWriteHelpers } from "../content/rest/__tests__/apiHelper";
const { view, edit, publish } = Permission;
const uploadDir = path.join(__dirname, ".uploads");
const itemShape = {
    author_name: expect.any(String),
    date: expect.any(String),
    id: expect.any(Number),
    kind: expect.any(String),
    model: expect.any(String),
    orderValue: expect.any(String),
    title: expect.any(String),
    type: expect.any(String)
};
describe("dashboard api", () => {
    let app;
    let persistence;
    beforeAll(async () => {
        const storage = new FsStorage(uploadDir);
        ({ app, persistence } = await init({
            models,
            storage,
            thumbnailProvider: new LocalThumbnailProvider(storage),
            persistenceAdapter: knexAdapter({
                client: "sqlite3",
                connection: {
                    filename: tempy.file()
                },
                useNullAsDefault: true
            })
        }));
    });
    afterAll(async () => {
        await fs.remove(uploadDir);
        return persistence.shutdown();
    });
    describe("dashboard", () => {
        let headersAdmin;
        let server;
        let headersLimited;
        let serverLimited;
        beforeAll(async () => {
            ({ headers: headersLimited, server: serverLimited } = await withTempRole(request(app), {
                settings: false,
                content: {
                    pages: view | edit | publish // tslint:disable-line:no-bitwise
                }
            }));
            let { create } = createApiWriteHelpers(serverLimited, headersLimited);
            await create("pages", { title: "Foo" });
            ({ server, headers: headersAdmin } = await login(request(app), "admin@cotype.dev", "admin"));
            ({ create } = createApiWriteHelpers(server, headersAdmin));
            await create("products", { title: "Bar" });
        });
        it("provides dashboard data", async () => {
            const { body: unpublished } = await server
                .get("/admin/rest/dashboard/unpublished")
                .set(headersAdmin)
                .expect(200);
            expect(unpublished).toStrictEqual({
                total: 2,
                items: [
                    expect.objectContaining(itemShape),
                    expect.objectContaining(itemShape)
                ]
            });
            const { body: updated } = await server
                .get("/admin/rest/dashboard/updated")
                .set(headersAdmin)
                .expect(200);
            expect(updated).toStrictEqual({
                total: 2,
                items: [
                    expect.objectContaining(itemShape),
                    expect.objectContaining(itemShape)
                ]
            });
            const { body: updatedByMe } = await server
                .get("/admin/rest/dashboard/updated-by-user")
                .set(headersAdmin)
                .expect(200);
            expect(updatedByMe).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
        });
        it("provides limited dashboard data with limited access rights", async () => {
            const { body: unpublished } = await serverLimited
                .get("/admin/rest/dashboard/unpublished")
                .set(headersLimited)
                .expect(200);
            expect(unpublished).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
            const { body: updated } = await serverLimited
                .get("/admin/rest/dashboard/updated")
                .set(headersLimited)
                .expect(200);
            expect(updated).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
            const { body: updatedByMe } = await serverLimited
                .get("/admin/rest/dashboard/updated-by-user")
                .set(headersLimited)
                .expect(200);
            expect(updatedByMe).toStrictEqual({
                total: 1,
                items: [expect.objectContaining(itemShape)]
            });
        });
    });
});
//# sourceMappingURL=dashboard.test.js.map