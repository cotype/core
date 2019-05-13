/// <reference path="../../../typings/request.d.ts"/>

import {
  Model,
  DataSource,
  ExternalDataSource,
  BaseUrls,
  Principal,
  Join
} from "../../../typings";

import { Router } from "express";
import { Persistence } from "../../persistence";
import _pick from "lodash/pick";
import _cloneDeep from "lodash/cloneDeep";
import prepareSearchResults from "./prepareSearchResults";
import filterRefData, { createJoin } from "./filterRefData";
import { checkPermissions, Permission } from "../../auth/acl";
import { linkableModelNames, searchableModelNames } from "./utils";

const modes = ["published", "drafts"];

export default (
  router: Router,
  persistence: Persistence,
  models: Model[],
  externalDataSources: ExternalDataSource[],
  baseUrls: BaseUrls
) => {
  const { content, media } = persistence;

  const linkableModels = linkableModelNames(models);
  const searchableModels = searchableModelNames(models);

  const getDataSource = (modelName: string): DataSource => {
    return (
      externalDataSources.find(({ contentTypes }: ExternalDataSource) => {
        return contentTypes.includes(modelName);
      }) || content
    );
  };

  const getModels = (name: string) => {
    return models.find(m => m.name.toLowerCase() === name.toLowerCase());
  };

  // TODO: add test
  const checkPermissionToJoin = (principle: Principal, join: Join = {}) => {
    const cleanJoin = createJoin(join, models);

    Object.keys(cleanJoin).forEach(j => {
      const model = getModels(j);
      if (!model) return;

      checkPermissions(principle, model, Permission.view);
    });
  };

  modes.forEach(mode => {
    /**
     * Set req.previewOpts, check preview permission and set cache headers.
     */
    router.use(`/rest/${mode}`, (req, res, next) => {
      if (mode === "drafts") {
        res.setHeader("Cache-Control", "private");
        req.previewOpts = { publishedOnly: false };

        if (!req.principal.permissions.preview) {
          res.status(403).end();
          return;
        }
      } else {
        res.setHeader("Cache-Control", "public, max-age=300");
        req.previewOpts = { publishedOnly: true };
      }
      res.header("Vary", "X-Richtext-Format");
      next();
    });

    /** Search */
    router.get(`/rest/${mode}/search/content`, async (req, res) => {
      const { principal, query } = req;

      const {
        term,
        limit = 50,
        offset = 0,
        includeModels = [],
        excludeModels = [],
        linkableOnly = true
      } = query;

      const allSearchModels =
        linkableOnly === "true" ? linkableModels : searchableModels;

      const sanitize = (m: string[]) =>
        m
          .map(n =>
            allSearchModels.find(n2 => n2.toLowerCase() === n.toLowerCase())
          )
          .filter(Boolean) as string[];

      const sanitizedIncludes = sanitize(includeModels);
      const sanitizedExcludes = sanitize(excludeModels);

      const searchModels = sanitizedIncludes.length
        ? sanitizedIncludes
        : allSearchModels.filter(n => !sanitizedExcludes.includes(n));

      if (!searchModels.length)
        return res.json({
          total: 0,
          items: [],
          _ref: {
            media: {},
            content: {}
          }
        });

      const items = await content.externalSearch(
        principal,
        term,
        {
          limit,
          offset,
          models: searchModels
        },
        req.previewOpts
      );

      const results = prepareSearchResults(items, models, baseUrls);

      const imageData = await media.load(principal, results.mediaIds);

      const mediaObj: any = {};
      imageData.forEach(m => {
        mediaObj[m.id] = m;
      });

      res.json({
        total: results.items.length,
        items: results.items,
        _ref: {
          media: mediaObj,
          content: {}
        }
      });
    });

    models.forEach(model => {
      const type = model.name;

      // List
      router.get(`/rest/${mode}/${type}`, async (req, res) => {
        const { principal, query } = req;
        const { limit = 50, offset = 0, join, order, orderBy, ...rest } = query;

        checkPermissionToJoin(req.principal, join);

        const criteria = rest && Object.keys(rest).length ? rest : undefined;
        const format = req.get("x-richtext-format") || "html";

        const dataSource = getDataSource(type);

        if (model.collection === "singleton") {
          const { items, total, _refs } = await dataSource.find(
            principal,
            model,
            { limit: 1, offset: 0 },
            format,
            criteria,
            req.previewOpts
          );

          if (total > 0) {
            const [item] = items;
            return res.json({
              ...item.data,
              _id: item.id.toString(),
              _refs: filterRefData(items, _refs, join, models)
            });
          }

          res.status(404).end();
        } else {
          const { total, items, _refs } = await dataSource.find(
            principal,
            model,
            { limit, offset, order, orderBy },
            format,
            criteria,
            req.previewOpts
          );

          res.json({
            total,
            items: items.map(i => ({ _id: i.id.toString(), ...i.data })),
            _refs: filterRefData(items, _refs, join, models)
          });
        }
      });

      // load
      router.get(`/rest/${mode}/${type}/:id`, async (req, res) => {
        const { principal, params, query } = req;
        const { join } = query;

        checkPermissionToJoin(req.principal, join);
        const dataSource = getDataSource(type);

        const format = req.get("x-richtext-format");

        const c = await dataSource.load(
          principal,
          model,
          params.id,
          format,
          req.previewOpts
        );

        if (!c) return res.status(404).end();
        res.setHeader("last-modified", new Date(c.date).toUTCString());

        res.json({
          ...c.data,
          _id: c.id.toString(),
          _refs: filterRefData([c], c._refs, join, models)
        });
      });

      // loadByUniqueField
      if (model.uniqueFields) {
        model.uniqueFields.forEach(uniqueField => {
          router.get(
            `/rest/${mode}/${type}/${uniqueField}/:uniqueValue`,
            async (req, res) => {
              const { principal, query, params } = req;
              const { join } = query;

              checkPermissionToJoin(req.principal, join);

              const criteria = {
                [`data.${uniqueField}`]: {
                  eq: params.uniqueValue
                }
              };
              const format = req.get("x-richtext-format") || "html";

              const dataSource = getDataSource(type);

              const { total, items, _refs } = await dataSource.find(
                principal,
                model,
                { limit: 1, offset: 0 },
                format,
                criteria,
                req.previewOpts
              );

              if (!total) return res.status(404).end();

              res.json({
                ...items[0].data,
                _id: items[0].id.toString(),
                _refs: filterRefData(items, _refs, join, models)
              });
            }
          );
        });
      }
    });
  });
};
