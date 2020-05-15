/// <reference path="../../../typings/request.d.ts"/>

import {
  Model,
  DataSource,
  ExternalDataSource,
  Principal,
  Join,
  ListOpts,
  ListChunkWithRefs,
  Content,
  ContentWithRefs,
  ResponseHeaders
} from "../../../typings";

import { Router } from "express";
import { Persistence } from "../../persistence";
import prepareSearchResults from "./prepareSearchResults";
import filterRefData, { createJoin } from "./filterRefData";
import { checkPermissions, Permission } from "../../auth/acl";
import { linkableAndSearchableModelNames, searchableModelNames } from "./utils";
import pickFieldsFromResultData from "./pickFieldsFromResultData";

const modes = ["published", "drafts"];

export default function routes(
  router: Router,
  persistence: Persistence,
  models: Model[],
  externalDataSources: ExternalDataSource[],
  mediaUrl: string,
  responseHeaders?: ResponseHeaders
) {
  const { content, media } = persistence;
  const headers = responseHeaders && responseHeaders.rest;
  const linkableModels = linkableAndSearchableModelNames(models);
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

  function getSearchModels(query: any) {
    const {
      includeModels = [],
      excludeModels = [],
      linkableOnly = "true"
    } = query;

    const all = linkableOnly === "true" ? linkableModels : searchableModels;

    const pickModels = (names: string[]) =>
      all.filter(name =>
        names.some(n => n.toLowerCase() === name.toLowerCase())
      );

    const includes = pickModels(includeModels);
    const excludes = pickModels(excludeModels);

    return includes.length ? includes : all.filter(n => !excludes.includes(n));
  }

  modes.forEach(mode => {
    /**
     * Set req.previewOpts, check preview permission and set cache headers.
     */
    router.use(`/rest/${mode}`, (req, res, next) => {
      if (mode === "drafts") {
        res.setHeader("Cache-Control", "private");
        if (headers && headers.drafts) {
          Object.entries(headers.drafts).forEach(([key, value]) =>
            res.setHeader(key, value)
          );
        }
        req.previewOpts = { publishedOnly: false };

        if (!req.principal.permissions.preview) {
          res.status(403).end();
          return;
        }
      } else {
        res.setHeader("Cache-Control", "public, max-age=300");
        if (headers && headers.published) {
          Object.entries(headers.published).forEach(([key, value]) =>
            res.setHeader(key, value)
          );
        }
        req.previewOpts = { publishedOnly: true };
      }
      res.header("Vary", "X-Richtext-Format");
      next();
    });

    /** Search */
    router.get(`/rest/${mode}/search/content`, async (req, res) => {
      const { principal, query } = req;
      const { term, limit = 50, offset = 0 } = query as any;
      const searchModels = getSearchModels(query as any);

      if (!searchModels.length) {
        return res.json({
          total: 0,
          items: [],
          _refs: {
            media: {},
            content: {}
          }
        });
      }

      const results = await content.externalSearch(
        principal,
        term,
        {
          limit,
          offset,
          models: searchModels
        },
        req.previewOpts
      );

      const preparedResults = prepareSearchResults(results, models, mediaUrl);

      const imageData = await media.load(principal, preparedResults.mediaIds);

      const mediaObj: any = {};
      imageData.forEach(m => {
        mediaObj[m.id] = m;
      });

      res.json({
        total: results.total,
        items: preparedResults.items,
        _refs: {
          media: mediaObj,
          content: {}
        }
      });
    });

    router.get(`/rest/${mode}/search/suggest`, async (req, res) => {
      const { principal, query } = req;
      const { term } = query as any;
      const searchModels = getSearchModels(query as any);

      if (!searchModels.length) {
        return res.json([]);
      }

      const results = await content.suggest(principal, term, req.previewOpts);
      res.json(results);
    });

    models
      .filter(m => m.collection !== "iframe")
      .forEach(model => {
        const type = model.name;

        // List
        router.get(`/rest/${mode}/${type}`, async (req, res) => {
          const { principal, query } = req;
          const {
            search = {},
            limit = 50,
            offset = 0,
            join,
            order,
            orderBy,
            fields,
            ...rest
          } = query as any;

          const opts: ListOpts = { search, offset, limit, order, orderBy };

          checkPermissionToJoin(req.principal, join);

          const criteria = rest && Object.keys(rest).length ? rest : undefined;
          const format = req.get("x-richtext-format") || "html";

          const dataSource = getDataSource(type);

          // If collection is singleton, return the first item in the list
          if (model.collection === "singleton") {
            let result = await dataSource.find(
              principal,
              model,
              opts,
              format,
              join,
              criteria,
              req.previewOpts
            );

            if (result.total > 0) {
              // Pick the selected fields
              if (fields) {
                result = pickFieldsFromResultData(
                  result,
                  fields
                ) as ListChunkWithRefs<Content>;
              }
              const { items, _refs } = result;
              const [item] = items;

              return res.json({
                ...item.data,
                _id: item.id.toString(),
                _refs: filterRefData(items, _refs, join, models)
              });
            }

            res.status(404).end();
          } else {
            let results = await dataSource.find(
              principal,
              model,
              opts,
              format,
              join,
              criteria,
              req.previewOpts
            );

            if (fields) {
              results = pickFieldsFromResultData(
                results,
                fields
              ) as ListChunkWithRefs<Content>;
            }
            const { total, items, _refs } = results;

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
          const { join, fields } = query as any;

          checkPermissionToJoin(req.principal, join);
          const dataSource = getDataSource(type);

          const format = req.get("x-richtext-format");

          let result = await dataSource.load(
            principal,
            model,
            params.id,
            join,
            format,
            req.previewOpts
          );

          if (!result) return res.status(404).end();
          res.setHeader("last-modified", new Date(result.date).toUTCString());

          if (fields) {
            result = pickFieldsFromResultData(
              result,
              fields
            ) as ContentWithRefs;
          }

          res.json({
            ...result.data,
            _id: result.id.toString(),
            _refs: filterRefData([result], result._refs, join, models)
          });
        });

        // loadByUniqueField
        if (model.uniqueFields) {
          model.uniqueFields.forEach(uniqueField => {
            router.get(
              `/rest/${mode}/${type}/${uniqueField}/:uniqueValue`,
              async (req, res) => {
                const { principal, query, params } = req;
                const { join, fields } = query as any;

                checkPermissionToJoin(req.principal, join);

                const criteria = {
                  [`data.${uniqueField}`]: {
                    eq: params.uniqueValue
                  }
                };
                const format = req.get("x-richtext-format") || "html";

                const dataSource = getDataSource(type);

                let result = await dataSource.find(
                  principal,
                  model,
                  { limit: 1, offset: 0 },
                  format,
                  join,
                  criteria,
                  req.previewOpts
                );

                if (!result.total) return res.status(404).end();

                if (fields) {
                  result = pickFieldsFromResultData(
                    result,
                    fields
                  ) as ListChunkWithRefs<Content>;
                }

                const { items, _refs } = result;
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
}
