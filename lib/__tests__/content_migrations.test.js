import path from "path";
import tempy from "tempy";
import fs from "fs-extra";
import faker from "faker";
import request from "supertest";
import { init, knexAdapter } from "..";
import { login } from "./util";
import FsStorage from "../media/storage/FsStorage";
import LocalThumbnailProvider from "@cotype/local-thumbnail-provider";
import { createApiReadHelpers } from "../content/rest/__tests__/apiHelper";
import waitForExpect from "wait-for-expect";
const uploadDir = path.join(__dirname, ".uploads");
const initialFields = {
    initialField: {
        type: "string"
    }
};
export const initialModel = {
    name: "migrateMe",
    fields: initialFields
};
const updatedModel = {
    name: initialModel.name,
    fields: Object.assign(Object.assign({}, initialFields), { newField: {
            type: "string"
        } })
};
export const publishedData = {
    initialField: faker.lorem.words(2),
    newField: faker.lorem.words(2)
};
export const draftsData = {
    initialField: faker.lorem.words(2),
    newField: faker.lorem.words(2)
};
describe("content migrations", () => {
    let app;
    let persistence;
    let server;
    let find;
    beforeAll(async () => {
        const storage = new FsStorage(uploadDir);
        ({ app, persistence } = await init({
            models: [updatedModel],
            storage,
            thumbnailProvider: new LocalThumbnailProvider(storage),
            persistenceAdapter: knexAdapter({
                client: "sqlite3",
                connection: {
                    filename: tempy.file()
                },
                seeds: {
                    directory: path.join(__dirname, "./migrationSeeds"),
                    uploads: uploadDir
                },
                useNullAsDefault: true
            }),
            migrationDir: path.join(__dirname, "./migrations")
        }));
        ({ server } = await login(request(app), "admin@cotype.dev", "admin"));
        ({ find } = createApiReadHelpers(server));
    });
    afterAll(async () => {
        await fs.remove(uploadDir);
        return persistence.shutdown();
    });
    it("should have rewritten/added/removed data", async () => {
        const defaultData = { _id: "1", _refs: { content: {}, media: {} } };
        await waitForExpect(async () => {
            await expect(await find(initialModel.name, "1", {}, false)).toStrictEqual(Object.assign(Object.assign({}, draftsData), defaultData));
        });
        await waitForExpect(async () => {
            expect(await find(initialModel.name, "1", {}, true)).toStrictEqual(Object.assign(Object.assign({}, publishedData), defaultData));
        });
    });
});
//# sourceMappingURL=content_migrations.test.js.map