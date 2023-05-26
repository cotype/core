"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = __importDefault(require("../log"));
const ReferenceConflictError_1 = __importDefault(require("../persistence/errors/ReferenceConflictError"));
const inspect_1 = __importDefault(require("./inspect"));
const upload_1 = __importDefault(require("./upload"));
const login_1 = __importDefault(require("../auth/login"));
function isSvg(name) {
    return !!name.match(/[A-Za-z0-9_-]*\.*svg$/);
}
function routes(router, persistence, storage) {
    const { media } = persistence;
    const uploadHandler = (0, upload_1.default)(storage);
    router.use("/admin/rest/upload", login_1.default);
    router.post("/admin/rest/upload", uploadHandler, async (req, res) => {
        const { principal, files: filesUpload } = req;
        const files = [];
        const duplicates = [];
        if (!Array.isArray(filesUpload))
            return res.status(500).end();
        for (const fileKey in filesUpload) {
            if (filesUpload.hasOwnProperty(fileKey)) {
                const { filename: id, originalname, size } = filesUpload[fileKey];
                const { width, height, ext, hash, mime } = await (0, inspect_1.default)(storage.retrieve(id), storage.getFile(id));
                let mimetype = mime;
                let imagetype = mime && mime.startsWith("image") ? ext : null;
                // Our inspector is not able to correctly detect svg files.
                // Therefore we only use the file extension to determine the mimetype / imagetype of SVGs.
                if (isSvg(id)) {
                    mimetype = "image/svg+xml";
                    imagetype = "svg";
                }
                const file = {
                    id,
                    size,
                    originalname,
                    mimetype,
                    imagetype,
                    width,
                    height,
                    hash
                };
                try {
                    await media.create(principal, file);
                    files.push(file);
                }
                catch (error) {
                    // Find the already existing file(s)
                    const [data] = await media.findByHash([hash]);
                    duplicates.push(data);
                    files.push(data);
                    // remove previously uploaded duplicate
                    storage.remove(id);
                }
            }
        }
        res.json({ files, duplicates });
    });
    router.use("/admin/rest/media", login_1.default);
    router.get("/admin/rest/media", async (req, res) => {
        const { principal, query } = req;
        const { limit = 50, offset = 0, orderBy, order, search, mimetype, unUsed, used } = query;
        const list = await media.list(principal, {
            limit,
            offset,
            orderBy,
            order,
            search,
            mimetype,
            unUsed: !!unUsed,
            used: !!used
        });
        res.json(list);
    });
    router.get("/admin/rest/media/*", async (req, res) => {
        const { principal, params } = req;
        const id = prepareMediaId(params[0]);
        const [data] = await media.load(principal, [id]);
        if (!data)
            return res.status(404).end();
        res.json(data);
    });
    router.post("/admin/rest/media/*", async (req, res) => {
        const { principal, params, body } = req;
        const id = prepareMediaId(params[0]);
        const data = await media.update(principal, id, body);
        if (data) {
            res.status(200).end();
        }
        else {
            res.status(400).end();
        }
    });
    router.delete("/admin/rest/media/*", async (req, res) => {
        const { principal, params } = req;
        const id = prepareMediaId(params[0]);
        try {
            await media.delete(principal, id);
            storage.remove(id);
            res.status(204).end();
        }
        catch (err) {
            if (err instanceof ReferenceConflictError_1.default) {
                res.status(400).json(err.refs);
            }
            else {
                log_1.default.error(err);
                res.status(500).end();
            }
        }
    });
}
exports.default = routes;
// Remove trailing slash
function prepareMediaId(id) {
    return id.replace(/\/$/g, "");
}
//# sourceMappingURL=routes.js.map