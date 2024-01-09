//@ts-nocheck
// TODO Factor out as stand-alone npm module
/**
 * Routes to search & serve material design icons.
 */
import { Router } from "express";

// TODO Just read in meta data and fetch paths from the filesystem if needed
import { icons, Icon } from "mdi-json";

const svg = (
  icon: Icon
) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path d="${icon.path}" />
</svg>`;

export default (router: Router) => {
  router.get(`/admin/rest/icons`, (req, res) => {
    res.json(icons);
  });

  router.get(`/admin/rest/icons/:name.svg`, (req, res) => {
    const icon = icons.find(i => i.name === req.params.name);
    if (!icon) res.status(404).end();
    else {
      res.set("Content-Type", "image/svg+xml");
      res.send(svg(icon));
    }
  });

  router.get(`/admin/rest/icons/:name`, (req, res) => {
    const icon = icons.find(i => i.name === req.params.name);
    if (!icon) res.status(404).end();
    else res.json(icon.path);
  });
};
