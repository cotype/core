import * as Cotype from "../../../../typings";
import knex from "knex";
import { ContentAdapter, Migration } from "..";
import extractRefs from "../../../model/extractRefs";
import extractText from "../../../model/extractText";
import extractValues from "../../../model/extractValues";
import { serialize, toNumber, isComparable } from "./lookup";
import ReferenceConflictError from "../../errors/ReferenceConflictError";
import _flatten from "lodash/flatten";
import _update from "lodash/update";
import UniqueFieldError, {
  NonUniqueField
} from "../../errors/UniqueFieldError";
import cleanSearchTerm from "./cleanSearchTerm";
import setPosition from "../../../model/setPosition";
import getAlwaysUniqueFields from "../../../model/getAlwaysUniqueFields";
import getPositionFields from "../../../model/getPositionFields";
import getInverseReferenceFields from "../../../model/getInverseReferenceFields";
import log from "../../../log";
import visitModel from "../../../model/visitModel";
import { Model } from "../../../../typings";
import MigrationContext from "../../MigrationContext";

const ops: any = {
  eq: "=",
  ne: "<>",
  gt: ">",
  lt: "<",
  gte: ">=",
  lte: "<=",
  like: "like"
};

const getFieldFromModelPath = (
  path: string,
  model: Cotype.Model
): Cotype.Field => {
  const fieldPath = path.split(".");
  return fieldPath.reduce((acc: any, el, index, arr) => {
    const last = arr.length - 1 === index;
    if (acc[el].type === "object" && !last) {
      return acc[el].fields;
    }
    if (acc[el].type === "list") {
      if (acc[el].item.type === "object" && !last) {
        return acc[el].item.fields;
      }
      return acc[el].item;
    }
    if (acc[el].type === "immutable") {
      if (acc[el].child.type === "object" && !last) {
        return acc[el].child.fields;
      }
      return acc[el].child;
    }

    return acc[el];
  }, model.fields);
};
const getRecursiveOrderField = (
  orderPath: string,
  m: Cotype.Model | Cotype.ObjectType,
  prefix = "",
  uniqueFields = [
    ...((m as Cotype.Model).uniqueFields || []),
    "title" in m ? m.title : "",
    "orderBy" in m ? m.orderBy : ""
  ]
): false | { isNumeric: boolean; withUpperCase: boolean } => {
  const [field, ...restPath] = orderPath.split(".");
  const type = m.fields[field];
  if (!type) {
    return false;
  }
  if (type.type === "list" && type.item) {
    if (type.item.type === "object" && type.item.fields) {
      return getRecursiveOrderField(
        restPath.join("."),
        type.item as Cotype.ObjectType,
        prefix + field + ".",
        uniqueFields
      );
    }

    if (
      (type.item.type === "string" || type.item.type === "number") &&
      (type.item.index || uniqueFields.includes(prefix + field))
    ) {
      return { isNumeric: type.item.type === "number", withUpperCase: false };
    }
    return false;
  }

  if (type.type === "object" && type.fields) {
    return getRecursiveOrderField(
      restPath.join("."),
      type,
      prefix + field + ".",
      uniqueFields
    );
  }
  if (
    (type.type === "string" ||
      type.type === "number" ||
      type.type === "position") &&
    (type.index || uniqueFields.includes(prefix + field))
  ) {
    return {
      isNumeric: type.type === "number",
      withUpperCase: type.type === "position"
    };
  }
  return false;
};

export default class KnexContent implements ContentAdapter {
  knex: knex;

  constructor(inputKnex: knex) {
    this.knex = inputKnex;
  }

  async create(
    model: Cotype.Model,
    data: any,
    author: string,
    models: Cotype.Model[]
  ) {
    await this.testUniqueFields(model, models, data);
    if (model.orderBy) {
      const lastItem = await this.list(model, models, {
        limit: 1,
        orderBy: model.orderBy,
        order: "desc",
        offset: 0
      });

      const orderPath = model.orderBy.split(".");

      const lastOrderValue = (orderPath.reduce(
        (obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined),
        lastItem.total > 0 ? lastItem.items[0].data : {}
      ) as unknown) as string;

      data = setPosition(data, model, lastOrderValue);
    }

    const [id] = await this.knex("contents")
      .insert({
        type: model.name
      })
      .returning("id");

    await this.createRev(model, id, 1, author, data, models);
    return id;
  }

  /**
   * Test if the any fields in data that are marked as unique in the model
   * already exists.
   */
  async testUniqueFields(
    model: Cotype.Model,
    models: Cotype.Model[],
    data: any,
    id?: string
  ): Promise<void> {
    let nonUniqueFields: NonUniqueField[] = [];
    const uniqueFields = getAlwaysUniqueFields(model, true);
    if (uniqueFields) {
      const resp = await Promise.all(
        uniqueFields.map(async f => {
          const criteria: any = {};

          const value = (f
            .split(".")
            .reduce(
              (obj, key) =>
                obj && obj[key] !== "undefined" ? obj[key] : undefined,
              data
            ) as unknown) as string;

          criteria[`data.${f}`] = { eq: value, ne: "" };
          const opts = { offset: 0, limit: 1 };
          const p1 = this.list(model, models, opts, criteria);
          const p2 = this.list(model, models, opts, criteria, {
            publishedOnly: true,
            ignoreSchedule: true
          });
          const res = await Promise.all([p1, p2]);

          const items = _flatten(res.map(r => r.items));
          const existing = items.find(
            i => i.id.toString() !== (id && id.toString())
          );
          if (existing) {
            return { field: f, existingContentId: existing.id };
          }
        })
      );

      const IsDefined = (Boolean as any) as <T>(x: T | undefined) => x is T;
      nonUniqueFields = resp.filter(IsDefined);
    }
    if (nonUniqueFields.length) throw new UniqueFieldError(nonUniqueFields);
  }
  /**
   * Test if a value of a position field already Exists
   */
  async testPositionFields(
    model: Cotype.Model,
    models: Cotype.Model[],
    data: any,
    id: string
  ): Promise<any> {
    const positionFields = getPositionFields(model);
    if (positionFields) {
      await Promise.all(
        positionFields.map(async f => {
          const criteria: any = {};

          const value = (f.split(".").reduce((obj, key) => {
            if (obj && obj[key] !== "undefined") {
              return obj[key];
            } else {
              obj[key] = "";
              return obj[key];
            }
          }, data) as unknown) as string;
          if (value !== undefined) {
            criteria[`data.${f}`] = { gte: value };
          }

          const opts = { offset: 0, limit: 3, orderBy: f, order: "asc" };
          const items = await this.list(model, models, opts, criteria);
          items.items = items.items.filter(item => item.id === id);
          let nextPos;
          if (items.items[0]) {
            nextPos = (f
              .split(".")
              .reduce(
                (obj: any, key) =>
                  obj && obj[key] !== "undefined" ? obj[key] : undefined,
                items.items[0].data
              ) as unknown) as string;
            if (value === nextPos && items.items[1]) {
              nextPos = (f
                .split(".")
                .reduce(
                  (obj: any, key) =>
                    obj && obj[key] !== "undefined" ? obj[key] : undefined,
                  items.items[1].data
                ) as unknown) as string;
            }
          }
          data = setPosition(data, model, value, nextPos, true);
        })
      );
    }
    return data;
  }

  async createRevision(
    model: Cotype.Model,
    id: string,
    author: string,
    data: object,
    models: Cotype.Model[]
  ) {
    data = await this.testPositionFields(model, models, data, id);

    await this.testUniqueFields(model, models, data, id);

    const [content] = await this.knex("contents")
      .select(["latest_rev"])
      .where({ id });

    const rev = (content.latest_rev || 0) + 1;
    return this.createRev(model, id, rev, author, data, models);
  }

  async createRev(
    model: Cotype.Model,
    id: string,
    rev: number,
    author: string,
    data: object,
    models: Cotype.Model[]
  ) {
    await this.knex("content_revisions").insert({
      id,
      rev,
      data: JSON.stringify(data),
      author
    });

    // Set the new revision as latest on the content
    await this.knex("contents")
      .where({ id })
      .update({ latest_rev: rev });

    await this.indexRevision(model, id, rev, data, models);

    return rev;
  }

  async indexRevision(
    model: Cotype.Model,
    id: string,
    rev: number,
    data: object,
    models: Cotype.Model[],
    published = false
  ) {
    // Delete content_values except the published ones
    await this.knex("content_values")
      .where({ id, published })
      .del();

    // Delete content_search except the published one
    await this.knex("content_search")
      .where({ id, published })
      .del();

    await this.extractValues(data, model, id, rev, published);
    await this.extractText(data, model, id, rev, published);

    const refs = extractRefs(data, model, models);
    if (refs.length) {
      // Insert refs one by one in case a foreign key constraint violation occurs.
      // In a perfect world there shouldn't be any dead references in the first place, but...
      for (const refKey in refs) {
        if (refs.hasOwnProperty(refKey)) {
          const ref = refs[refKey];
          try {
            await this.knex("content_references").insert({
              id,
              rev,
              ...ref
            });
          } catch (error) {
            log.error("createRev: " + error.code);
            log.error(error.sqlMessage);
            log.error("SQL: " + error.sql);
          }
        }
      }
    }
  }

  extractValues(
    data: any,
    model: Cotype.Model,
    id: string,
    rev: number,
    published: boolean
  ) {
    const values = extractValues(data, model);
    const rows: any[] = [];
    Object.entries(values).forEach(([field, value]) => {
      const fieldType = getFieldFromModelPath(field, model);
      if (Array.isArray(value)) {
        return value.forEach(val =>
          rows.push({
            id,
            rev,
            published,
            field,
            ...serialize(val, fieldType)
          })
        );
      }
      return rows.push({
        id,
        rev,
        published,
        field,
        ...serialize(value, fieldType)
      });
    });

    return this.knex.batchInsert("content_values", rows);
  }

  extractText(
    data: any,
    model: Cotype.Model,
    id: string,
    rev: number,
    published: boolean
  ) {
    const text = `${model.singular} ${extractText(data, model)}`.toLowerCase();
    return this.knex("content_search").insert({
      id,
      rev,
      published,
      text
    });
  }

  async loadContentReferences(
    id: string[],
    model: Cotype.Model,
    models: Cotype.Model[],
    published?: boolean,
    join: Cotype.Join[] = [{}]
  ) {
    let fullData: Cotype.Data[] = [];

    const fetch = async (ids: string[], types: string[], first: boolean) => {
      // Only get references when needed
      // since this can be a expensive db operation
      let modelHasReverseReferences = false;
      let modelHasReferences = false;

      (first ? [model.name] : types).forEach(typeName => {
        const typeModel = first
          ? model
          : models.find(m => m.name.toLowerCase() === typeName.toLowerCase());

        if (!typeModel) return;

        visitModel(typeModel, (key, value) => {
          if (!("type" in value)) return;

          if (value.type === "references") {
            modelHasReverseReferences = true;
          }
          if (value.type === "content") {
            modelHasReferences = true;
          }
        });
      });

      // we don't need to load anything if a model has no refs and it is a first level fetch
      // otherwise we still need to load the main data of that join
      if (first && !modelHasReverseReferences && !modelHasReferences) return [];

      const refs = this.knex
        .distinct(["crv.data", "c.id", "c.type"])
        .from("contents as c")
        .innerJoin("content_references as cr", j => {
          j.orOn("c.id", "cr.content");
          j.orOn("c.id", "cr.id");
        })
        .innerJoin("content_revisions as crv", j => {
          j.on("crv.rev", published ? "c.published_rev" : "c.latest_rev");
          j.andOn("crv.id", "c.id");
        })

        .leftJoin("content_references as cr2", j => {
          j.orOn("cr.id", "cr2.content");
        })
        .where("c.deleted", false);

      // Only get references when needed
      // since this can be a expensive db operation
      refs.andWhere(k => {
        if (modelHasReferences) {
          k.orWhereIn("cr.id", ids);
        }
        if (modelHasReverseReferences) {
          k.orWhereIn("cr.content", ids);
        }
      });

      if (!first) {
        refs.whereIn(
          "c.type",
          types.map(m => m[0].toLowerCase() + m.substring(1))
        );
      }
      return (await refs).map((ref: any) =>
        this.parseData(ref)
      ) as Cotype.Data[];
    };

    let checkIds = id;
    for (let i = 0; i < join.length; i++) {
      const thisjoin = join[i];
      const data = await fetch(checkIds, Object.keys(thisjoin), i === 0);
      fullData = [...fullData, ...data];
      checkIds = data.map(d => d.id);
    }
    return fullData;
  }

  async loadMediaFromContents(ids: string[], published?: boolean) {
    return (await this.knex
      .select(["media.*"])
      .from("content_references")
      .join("contents", j => {
        j.on("contents.id", "content_references.id");
        j.on(
          published ? "contents.published_rev" : "contents.latest_rev",
          "content_references.rev"
        );
      })
      .join("media", j => {
        j.on("content_references.media", "media.id");
      })
      .whereIn("contents.id", ids)
      .andWhere("contents.deleted", false)) as Cotype.Meta[];
  }

  async load(
    model: Cotype.Model,
    id: string,
    previewOpts: Cotype.PreviewOpts = {}
  ) {
    const k = this.knex("contents")
      .join("content_revisions", join => {
        join.on("contents.id", "content_revisions.id");
        join.on(
          previewOpts.publishedOnly
            ? "contents.published_rev"
            : "contents.latest_rev",
          "content_revisions.rev"
        );
      })
      .where({
        "contents.id": id,
        "contents.type": model.name,
        "contents.deleted": false
      });

    if (previewOpts.publishedOnly && !previewOpts.ignoreSchedule) {
      k.andWhere((k2: any) => {
        k2.where("contents.visibleFrom", "<=", new Date()).orWhereNull(
          "contents.visibleFrom"
        );
      });
      k.andWhere((k2: any) => {
        k2.where("contents.visibleUntil", ">=", new Date()).orWhereNull(
          "contents.visibleUntil"
        );
      });
    }
    const inverseReferences = getInverseReferenceFields(model);
    if (inverseReferences.length > 0) {
      const inverseRefs = this.knex("content_references as iRef")
        .select(this.aggregateRefs("iCont.id", "iCont.type", "iRef.fieldnames"))
        .leftJoin("contents as iCont", join => {
          join.on("iRef.id", "iCont.id");
          join.andOn(
            "iRef.rev",
            previewOpts.publishedOnly
              ? "iCont.published_rev"
              : "iCont.latest_rev"
          );
        })
        .where("iRef.content", (this.knex as any).ref("contents.id"))
        .andWhere(where => {
          where.whereNull("iRef.id");
          where.orWhereNotNull("iCont.id");
        })
        .groupBy("iRef.content")
        .as("inverseRefs");
      k.select(inverseRefs);
    }

    const content = await k
      .select(["contents.*", "content_revisions.data"])
      .first();

    return content ? this.parseData(content, model) : null;
  }

  async loadRevision(model: Cotype.Model, id: string, rev: number) {
    const content = await this.knex("content_revisions as cr")
      .join("contents as c", "c.id", "cr.id")
      .where({
        "cr.id": id,
        "cr.rev": rev,
        "c.type": model.name,
        "c.deleted": false
      })
      .first("c.id", "cr.data");
    return content && { id: content.id, rev, data: JSON.parse(content.data) };
  }

  async listVersions(model: Cotype.Model, id: string) {
    const versions = await this.knex("content_revisions as cr")
      .join("contents as c", "cr.id", "c.id")
      .join("users", "users.id", "cr.author")
      .where({
        "c.type": model.name,
        "c.id": id
      })
      .select([
        "c.type",
        "c.id",
        "c.latest_rev",
        "c.published_rev",
        "cr.rev",
        "cr.date",
        "users.name as author_name",
        this.knex.raw("c.latest_rev = cr.rev as latest"),
        this.knex.raw("c.published_rev = cr.rev as published")
      ])
      .orderBy("cr.rev", "desc");

    return versions.map((v: Cotype.VersionItem) => ({
      ...v,
      latest: !!v.latest,
      published: !!v.published
    }));
  }

  async setPublishedRev(
    model: Cotype.Model,
    id: string,
    publishedRev: number | null,
    models: Cotype.Model[]
  ) {
    if (publishedRev === null) {
      // Check if content is referenced by another content
      await this.checkReferrers(id);
    }

    // TODO: check if referenced content still exists

    // Delete values from previously published revision
    await this.knex("content_values")
      .where({ id, published: true })
      .del();

    // Delete search from previously published revision
    await this.knex("content_search")
      .where({ id, published: true })
      .del();

    if (publishedRev !== null) {
      // Insert values for newly published revision
      const { data } = await this.loadRevision(model, id, publishedRev);
      const c = await this.knex("contents")
        .where({ id })
        .first();

      await this.checkReferences(id, publishedRev, c);
      await this.extractValues(data, model, id, publishedRev, true);
      await this.extractText(data, model, id, publishedRev, true);
    }

    // Update the published_rev column
    await this.knex("contents")
      .where({ id, type: model.name })
      .update({ published_rev: publishedRev });
  }

  /**
   * Make sure all referenced contents are either optional or:
   * - published
   * - visible before the referring content
   * - visible until the referring content expires
   */
  async checkReferences(
    id: string,
    rev: number,
    schedule: Cotype.Schedule
  ): Promise<void> {
    const { visibleFrom, visibleUntil } = schedule;
    const references = await this.knex
      .distinct(["contents.id", "contents.type", "content_revisions.data"])
      .from("content_references")
      .join("contents", join => {
        join.on("contents.id", "content_references.content");
      })
      .join("content_revisions", join => {
        join.on("content_revisions.id", "contents.id");
        join.on("content_revisions.rev", "contents.latest_rev"); // return latest rev so that user can find it by title
      })
      .where({
        "content_references.id": id,
        "content_references.rev": rev,
        "content_references.optional": false
      })
      .andWhere(k => {
        k.whereNull("contents.published_rev");

        // refs that expire before the referring content
        if (visibleUntil) k.orWhere("contents.visibleUntil", "<", visibleUntil);
        else k.orWhereNotNull("contents.visibleUntil");

        // refs that become visible after the referring content
        k.orWhere(
          "contents.visibleFrom",
          ">",
          new Date(
            Math.max(visibleFrom ? visibleFrom.getTime() : 0, Date.now())
          )
        );
      });

    if (references.length > 0) {
      const err = new ReferenceConflictError({ type: "content" });
      err.refs = references.map((ref: any) => this.parseData(ref));
      throw err;
    }
  }

  /**
   * Make sure all contents referring to the given id are either deleted,
   * no longer visible (or - TODO - optional).
   */
  async checkReferrers(id: string) {
    const contents = await this.knex
      .distinct(["contents.id", "contents.type", "content_revisions.data"])
      .from("content_references")
      .join("contents", join => {
        join.on("contents.id", "content_references.id");
        join.andOn("contents.published_rev", "content_references.rev");
      })
      .join("content_revisions", join => {
        join.on("content_revisions.id", "contents.id");
        join.on("content_revisions.rev", "contents.latest_rev"); // return latest rev so that user can find it by title
      })
      .where({ content: id, optional: false })
      .andWhere("contents.deleted", false)
      .andWhere((
        k // still visible
      ) =>
        k
          .where("contents.visibleUntil", ">", new Date())
          .orWhereNull("contents.visibleUntil")
      );

    if (contents.length > 0) {
      // TODO action delete/unpublish/schedule
      const err = new ReferenceConflictError({ type: "content" });
      err.refs = contents.map(c => this.parseData(c));
      throw err;
    }
  }

  async delete(model: Cotype.Model, id: string) {
    await this.checkReferrers(id);
    await this.knex("contents")
      .where({ type: model.name, id })
      .update({ deleted: true });

    await this.knex("content_references")
      .where({ id })
      .del();
  }

  async schedule(
    model: Cotype.Model,
    id: string,
    schedule: Cotype.Schedule
  ): Promise<void> {
    const { visibleFrom = null, visibleUntil = null } = schedule;
    const c = await this.knex("contents")
      .where({ type: model.name, id })
      .first();

    const rev = c.published_rev || c.latest_rev;

    await this.checkReferrers(id);
    await this.checkReferences(id, rev, schedule);

    await this.knex("contents")
      .where({ type: model.name, id })
      .update({
        visibleFrom: visibleFrom && new Date(visibleFrom),
        visibleUntil: visibleUntil && new Date(visibleUntil)
      });
  }

  async search(
    term: string,
    exact: boolean,
    listOpts: Cotype.ListOpts,
    previewOpts: Cotype.PreviewOpts = {}
  ) {
    let k: knex.QueryBuilder;
    let text = term || "";

    const searchTable = text ? "content_search" : "contents";

    if (text) {
      text = term.toLowerCase().trim();
      k = this.knex("content_search");

      if (this.knex.client.config.client === "pg") {
        k.whereRaw("text @@ plainto_tsquery(?)", `${text}:*`);
      } else if (this.knex.client.config.client === "mysql") {
        if (exact) {
          k.whereRaw(
            "MATCH(text) AGAINST(? IN BOOLEAN MODE)",
            cleanSearchTerm(text)
          );
        } else {
          k.whereRaw("MATCH(text) AGAINST(?)", text);
        }
      } else {
        if (exact) {
          k.where("text", "like", `%${text}%`);
        } else {
          text.split(/\s+/).forEach(t => k.andWhere("text", "like", `%${t}%`));
        }
      }

      k.join("contents", join => {
        join.on("content_search.id", "contents.id");
        join.on(
          "content_search.rev",
          previewOpts.publishedOnly
            ? "contents.published_rev"
            : "contents.latest_rev"
        );
      });
    } else {
      k = this.knex("contents");
    }

    if (previewOpts.publishedOnly && !previewOpts.ignoreSchedule) {
      k.andWhere((k2: any) => {
        k2.where("contents.visibleFrom", "<=", new Date()).orWhereNull(
          "contents.visibleFrom"
        );
      });
      k.andWhere((k2: any) => {
        k2.where("contents.visibleUntil", ">=", new Date()).orWhereNull(
          "contents.visibleUntil"
        );
      });
    }

    k.join("content_revisions", join => {
      join.on(`${searchTable}.id`, "content_revisions.id");
      if (term) {
        join.on("content_search.rev", "content_revisions.rev");
      } else {
        join.on(
          `contents.${
            previewOpts.publishedOnly ? "published_rev" : "latest_rev"
          }`,
          "content_revisions.rev"
        );
      }
    });

    k.whereNot("contents.deleted", true);

    const { limit = 50, offset = 0, models = [] } = listOpts;
    if (models.length > 0) {
      k.andWhere("contents.type", "in", models.map(m => m));
    }

    const [count] = await k.clone().countDistinct(`${searchTable}.id as total`);
    const total = Number(count.total);

    k.distinct([
      `${searchTable}.id`,
      "contents.type",
      "content_revisions.data"
    ]);

    k.offset(Number(offset)).limit(Number(limit));

    const items = await k;

    return {
      total,
      items: items.map(i => this.parseData(i))
    };
  }

  async findByMedia(media: string) {
    const contents = await this.knex
      .distinct(["contents.id", "contents.type", "content_revisions.data"])
      .from("content_references")
      .join("contents", join => {
        join.on("contents.id", "content_references.id");
        join.on(j => {
          j.on("contents.latest_rev", "content_references.rev");
          j.orOn("contents.published_rev", "content_references.rev");
        });
      })
      .join("content_revisions", join => {
        join.on("content_revisions.id", "contents.id");
        join.on("content_revisions.rev", "contents.latest_rev");
      })
      .where("content_references.media", "=", media)
      .andWhere("contents.deleted", false);

    return contents.map(c => this.parseData(c));
  }

  async list(
    model: Cotype.Model,
    models: Cotype.Model[],
    listOpts: Cotype.ListOpts = {},
    criteria: Cotype.Criteria = {},
    previewOpts: Cotype.PreviewOpts = {}
  ): Promise<Cotype.ListChunk<Cotype.Content>> {
    const {
      limit = 50,
      offset = 0,
      order = "desc",
      orderBy,
      search
    } = listOpts;

    // only order by comparable fields
    const orderByFieldExists = orderBy
      ? getRecursiveOrderField(orderBy, model)
      : false;

    const k = this.knex("contents").where({
      "contents.type": model.name,
      "contents.deleted": false
    });

    if (previewOpts.publishedOnly && !previewOpts.ignoreSchedule) {
      k.andWhere((k2: any) => {
        k2.where("contents.visibleFrom", "<=", new Date()).orWhereNull(
          "contents.visibleFrom"
        );
      });
      k.andWhere((k2: any) => {
        k2.where("contents.visibleUntil", ">=", new Date()).orWhereNull(
          "contents.visibleUntil"
        );
      });
    }

    k.join("content_revisions", join => {
      join.on("contents.id", "content_revisions.id");
      join.on(
        previewOpts.publishedOnly
          ? "contents.published_rev"
          : "contents.latest_rev",
        "content_revisions.rev"
      );
    });

    if (search && search.term) {
      if (search.scope === "title") {
        if (model.title) criteria[model.title] = { like: `%${search.term}%` };
      } else {
        const searchTerm = search.term.toLowerCase().trim();
        k.join("content_search", join => {
          join.on("contents.id", "content_search.id");
          join.on(
            previewOpts.publishedOnly
              ? "contents.published_rev"
              : "contents.latest_rev",
            "content_search.rev"
          );
        });

        if (this.knex.client.config.client === "pg") {
          k.whereRaw(
            "content_search.text @@ plainto_tsquery(?)",
            `${searchTerm}:*`
          );
        } else if (this.knex.client.config.client === "mysql") {
          k.whereRaw("match(text) against(?)", searchTerm);
        } else {
          k.where("content_search.text", "like", `%${searchTerm}%`);
        }
      }
    }

    if (criteria) {
      Object.entries(criteria).forEach(([dataPath, criterion], j) => {
        if (model.customQuery && model.customQuery[dataPath]) {
          dataPath = model.customQuery[dataPath];
        }

        if (typeof criterion === "string") {
          criterion = { eq: criterion };
        }
        let fieldPath = dataPath.replace(/^data\./, "").split(".");
        if (criterion.path) {
          fieldPath = [...fieldPath, ...criterion.path.split(".")];
          delete criterion.path;
        }
        let lastContent = "contents";
        let lastModel = model;
        fieldPath.reduce((acc, pathStep, i, arr) => {
          const path = acc + pathStep;
          const counter = String(i) + String(j);
          const isLast = arr.length - 1 === i;
          const field = getFieldFromModelPath(path, lastModel);
          if (field.type === "object") {
            return path + ".";
          }
          if (
            field.type === "content" &&
            (field.model || (field.models && field.models.length === 1)) // Get Docs which referenced by document
          ) {
            // TODO: Criteria works just with one Model
            const selectModel: string =
              field.model || (field.models && field.models[0]) || "";
            k.innerJoin("content_references as ref" + counter, join => {
              join.on(`ref${counter}.id`, `${lastContent}.id`);
              join.andOn(
                `ref${counter}.rev`,
                previewOpts.publishedOnly
                  ? `${lastContent}.published_rev`
                  : `${lastContent}.latest_rev`
              );
            });
            k.innerJoin("contents as cont" + counter, join => {
              join.on(`ref${counter}.content`, `cont${counter}.id`);
              join.andOnIn(`cont${counter}.type`, [selectModel]);
            });
            lastContent = `cont${counter}`;
            lastModel = models.find(
              m =>
                m.name.toLocaleLowerCase() === selectModel.toLocaleLowerCase()
            ) as Cotype.Model;
            if (isLast) {
              // If last compare with ID of Content
              Object.entries(criterion).forEach(([op, value]) => {
                const sqlOp = ops[op];
                if (!sqlOp) throw new Error("Unsupported operator: " + op);
                if (op === "eq" && Array.isArray(value)) {
                  return k.whereIn(`${lastContent}.id`, value);
                }
                k.andWhere(`${lastContent}.id`, sqlOp, value);
              });
            }
            return "";
          }

          if (field.type === "references") {
            // Get Docs which reference document
            const selectModel = field.model;
            k.innerJoin("content_references as ref" + counter, join => {
              join.on(`ref${counter}.content`, `${lastContent}.id`);
            });
            k.innerJoin("contents as cont" + counter, join => {
              join.on(
                `ref${counter}.rev`,
                previewOpts.publishedOnly
                  ? `cont${counter}.published_rev`
                  : `cont${counter}.latest_rev`
              );
              join.andOn(`ref${counter}.id`, `cont${counter}.id`);
              join.andOnIn(`cont${counter}.type`, [field.model]);
            });
            lastContent = `cont${counter}`;
            lastModel = models.find(
              m =>
                m.name.toLocaleLowerCase() === selectModel.toLocaleLowerCase()
            ) as Cotype.Model;
            if (isLast) {
              // If last compare with ID of Content
              Object.entries(criterion).forEach(([op, value]) => {
                const sqlOp = ops[op];
                if (!sqlOp) throw new Error("Unsupported operator: " + op);
                if (op === "eq" && Array.isArray(value)) {
                  return k.whereIn(`${lastContent}.id`, value);
                }
                if (op === "ne" && Array.isArray(value)) {
                  return k.whereNotIn(`${lastContent}.id`, value);
                }
                k.andWhere(`${lastContent}.id`, sqlOp, value);
              });
            }
            return "";
          }
          k.innerJoin("content_values as vals" + counter, join => {
            join.on(
              `vals${counter}.rev`,
              previewOpts.publishedOnly
                ? `${lastContent}.published_rev`
                : `${lastContent}.latest_rev`
            );
            join.andOn(`vals${counter}.id`, `${lastContent}.id`);
            join.andOnIn(`vals${counter}.field`, [path]);
            Object.entries(criterion).forEach(([op, value]) => {
              const sqlOp = ops[op];
              if (!sqlOp) throw new Error("Unsupported operator: " + op);
              if (isComparable(field)) {
                if (op === "eq" && Array.isArray(value)) {
                  return k.whereIn(`vals${counter}.numeric`, value);
                }
                if (op === "ne" && Array.isArray(value)) {
                  return k.whereNotIn(`vals${counter}.numeric`, value);
                }
                k.andWhere(
                  `vals${counter}.numeric`,
                  sqlOp,
                  toNumber(value, field)
                );
              } else if (field.type === "position") {
                const v = value ? String(value).trim() : value;
                k.andWhere(`vals${counter}.literal`, sqlOp, v);
              } else {
                if (op === "eq" && Array.isArray(value)) {
                  return k.whereIn(
                    `vals${counter}.literal_lc`,
                    value.map(val => val.toLowerCase().trim())
                  );
                }
                if (op === "ne" && Array.isArray(value)) {
                  return k.whereNotIn(
                    `vals${counter}.literal_lc`,
                    value.map(val => val.toLowerCase().trim())
                  );
                }
                const v = value
                  ? String(value)
                      .toLowerCase()
                      .trim()
                  : value;
                k.andWhere(`vals${counter}.literal_lc`, sqlOp, v);
              }
            });
          });

          return "";
        }, "");
      });
    }

    if (orderBy && orderByFieldExists) {
      k.leftJoin("content_values as orderValue", join => {
        join.on("contents.id", "orderValue.id");
        join.on(
          previewOpts.publishedOnly
            ? "contents.published_rev"
            : "contents.latest_rev",
          "orderValue.rev"
        );
        join.andOnIn("orderValue.field", [orderBy]);
      });
    }
    const [count] = await k.clone().countDistinct("contents.id as total");
    const total = Number(count.total);
    if (total === 0) return { total, items: [] };

    k.distinct(["contents.id"]); // TODO get rid of distinct?

    const inverseReferences = getInverseReferenceFields(model);
    if (inverseReferences.length > 0) {
      const inverseRefs = this.knex("content_references as iRef")
        .select(this.aggregateRefs("iCont.id", "iCont.type", "iRef.fieldNames"))
        .leftJoin("contents as iCont", join => {
          join.on("iRef.id", "iCont.id");
          join.andOn(
            "iRef.rev",
            previewOpts.publishedOnly
              ? "iCont.published_rev"
              : "iCont.latest_rev"
          );
        })
        .where("iRef.content", (this.knex as any).ref("contents.id"))
        .andWhere(where => {
          where.whereNull("iRef.id");
          where.orWhereNotNull("iCont.id");
        })
        .groupBy("iRef.content")
        .as("inverseRefs");
      k.select(inverseRefs);
    }

    const orderByIsNumeric = orderByFieldExists && orderByFieldExists.isNumeric;
    const orderByUpperCase =
      orderByFieldExists && orderByFieldExists.withUpperCase;

    const orderByColumn = orderByFieldExists
      ? orderByIsNumeric
        ? "orderValue.numeric"
        : orderByUpperCase
        ? "orderValue.literal"
        : "orderValue.literal_lc"
      : null;

    k.offset(Number(offset))
      .limit(Number(limit))
      .orderBy(orderByColumn || "contents.id", order);

    const selectColumns = [
      "contents.id",
      "contents.type",
      "contents.visibleFrom",
      "contents.visibleUntil",
      "content_revisions.data"
    ];
    if (orderByColumn) {
      selectColumns.push(orderByColumn);
    }
    const items = k.select(selectColumns);
    return {
      total,
      items: (await items).map((item: any) => this.parseData(item, model))
    };
  }

  async rewrite(
    model: Cotype.Model,
    models: Cotype.Model[],
    iterator: (
      data: any,
      meta: { id: string; rev: number; latest: boolean; published: boolean }
    ) => any
  ) {
    const revs = await this.knex("content_revisions as cr")
      .join("contents as c", "cr.id", "c.id")
      .where({
        "c.type": model.name
      })
      .select(["cr.id", "cr.rev", "c.latest_rev", "c.published_rev"]);

    for (const { id, rev, latest_rev, published_rev } of revs) {
      const { data } = await this.knex("content_revisions")
        .where({ id, rev })
        .first("data");

      const meta = {
        id,
        rev,
        latest: rev === latest_rev,
        published: rev === published_rev
      };
      const rewritten = await iterator(JSON.parse(data), meta);

      if (rewritten) {
        await this.knex("content_revisions")
          .update("data", JSON.stringify(rewritten))
          .where({ id, rev });

        if (meta.latest || meta.published) {
          await this.indexRevision(
            model,
            id,
            rev,
            rewritten,
            models,
            rev === published_rev
          );
        }
      }
    }
  }

  async migrate(migrations: Migration[], models: Model[]) {
    const applied = await this.knex("migrations").where({ state: "applied" });
    const outstanding = migrations.filter(m => !applied.includes(m.name));
    const names = outstanding.map(({ name }) => name);
    try {
      // Mark outstanding migrations as 'pending'
      await this.knex("migrations").insert(
        names.map(name => ({ name, state: "pending" }))
      );
      const tx = await this.knex.transaction();
      try {
        const ctx = new MigrationContext(new KnexContent(tx), models);
        for (const m of outstanding) {
          await m.execute(ctx);
        }
        // Mark migrations as 'applied'
        await this.knex("migrations")
          .update({ state: "applied" })
          .whereIn("name", names)
          .del();
        tx.commit();
      } catch (err) {
        tx.rollback();
        // Delete pending migrations
        await this.knex("migrations")
          .whereIn("name", names)
          .del();
      }
    } catch (err) {
      // poll until other node is ready
      return new Promise((resolve, reject) => {
        const poll = async (retries = 3 * 60) => {
          // Wait until there are no more pending migrations
          const count = await this.knex("migrations")
            .where({ state: "pending" })
            .count();
          if (!count) resolve();
          else if (!retries)
            reject(
              new Error("Timeout while waiting for migrations to finish.")
            );
          else setTimeout(() => poll(retries - 1), 1000);
        };
        poll();
      });
    }
  }

  private aggregateRefs(idCol: string, typeCol: string, fieldNamesCol: string) {
    const concatString =
      this.knex.client.config.client !== "pg"
        ? this.knex.client.config.client === "sqlite3"
          ? `GROUP_CONCAT(?? || ':' || ?? || ':' || ??)`
          : `GROUP_CONCAT(??, ':', ??, ':', ??)`
        : `ARRAY_AGG(?? || ':' || ?? || ':' || ??)`;

    return this.knex.raw(concatString, [fieldNamesCol, typeCol, idCol]);
  }

  private parseData(
    {
      data,
      inverseRefs,
      ...rest
    }: { data: string; inverseRefs?: string | string[] },
    model?: Cotype.Model
  ) {
    const parsedData = JSON.parse(data);
    if (inverseRefs && model) {
      const fields = getInverseReferenceFields(model);
      const refs =
        typeof inverseRefs === "string" ? inverseRefs.split(",") : inverseRefs;

      fields.forEach(field => {
        _update(parsedData, field.path, () => []);
      });

      refs.forEach(ref => {
        const [, _fieldNames, _content, _id] = /(.+?):(.+?):(.+)/.exec(ref)!;
        const fieldNames = _fieldNames.split("~");
        fields.forEach(f => {
          if (f.model === _content && fieldNames.includes(f.fieldName)) {
            _update(parsedData, f.path, val =>
              (val || []).concat({
                _ref: "content",
                _content,
                _id
              })
            );
          }
        });
      });
    }
    return { data: parsedData, ...rest } as any;
  }
}
