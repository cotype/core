"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO Just read in meta data and fetch paths from the filesystem if needed
const mdi_json_1 = require("mdi-json");
const svg = (icon) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path d="${icon.path}" />
</svg>`;
exports.default = (router) => {
    router.get(`/admin/rest/icons`, (req, res) => {
        res.json(mdi_json_1.icons);
    });
    router.get(`/admin/rest/icons/:name.svg`, (req, res) => {
        const icon = mdi_json_1.icons.find(i => i.name === req.params.name);
        if (!icon)
            res.status(404).end();
        else {
            res.set("Content-Type", "image/svg+xml");
            res.send(svg(icon));
        }
    });
    router.get(`/admin/rest/icons/:name`, (req, res) => {
        const icon = mdi_json_1.icons.find(i => i.name === req.params.name);
        if (!icon)
            res.status(404).end();
        else
            res.json(icon.path);
    });
};
//# sourceMappingURL=routes.js.map