import path from "path";
import tempy from "tempy";
import fs from "fs-extra";
import request from "supertest";
import { init, knexAdapter } from "..";
import models from "./models";
import { login } from "./util";
import FsStorage from "../media/storage/FsStorage";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";
const uploadDir = path.join(__dirname, ".uploads");
describe("content hooks", () => {
    let app;
    let persistence;
    let headers;
    let server;
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
            }),
            contentHooks: {
                preHooks: {
                    onCreate: async (m, d) => {
                        if (d.title === "throw error")
                            return Promise.reject("Catch me if you can");
                        return { customOnCreateHookData: true };
                    },
                    onSave: async (m, d) => {
                        if (d.title === "throw error")
                            return Promise.reject("Catch me if you can");
                        return { customOnSaveHookData: true };
                    }
                }
            }
        }));
        ({ server, headers } = await login(request(app), "admin@cotype.dev", "admin"));
    });
    afterAll(async () => {
        await fs.remove(uploadDir);
        return persistence.shutdown();
    });
    const create = async (type, data) => {
        const { body } = await server
            .post(`/admin/rest/content/${type}`)
            .set(headers)
            .send({ data })
            .expect(200);
        return body.id;
    };
    const update = async (type, id, data) => {
        const { body } = await server
            .put(`/admin/rest/content/${type}/${id}`)
            .set(headers)
            .send(Object.assign({}, data))
            .expect(200);
        return body.id;
    };
    const get = async (type, id) => {
        const { body } = await server
            .get(`/admin/rest/content/${type}/${id}`)
            .set(headers)
            .expect(200);
        return body;
    };
    it("should apply onCreate hook", async () => {
        const id = await create("products", { title: "title" });
        const { data } = await get("products", id);
        await expect(data).toMatchObject({ customOnCreateHookData: true });
    });
    it("should apply onSave hook", async () => {
        const id = await create("products", { title: "title" });
        await update("products", id, { title: "updated title" });
        const { data } = await get("products", id);
        await expect(data).toMatchObject({ customOnSaveHookData: true });
    });
    it("should gracefully handle failing hooks", async () => {
        const id = await create("products", {
            title: "throw error"
        });
        await update("products", id, {
            title: "throw error"
        });
    });
});
//# sourceMappingURL=preHooks.test.js.map