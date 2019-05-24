import * as Cotype from "../../../../typings";

import knex from "knex";
import { MediaAdapter } from "..";
import ReferenceConflictError from "../../errors/ReferenceConflictError";
import pick from "lodash/pick";
import cleanSearchTerm from "./cleanSearchTerm";

export default class KnexMedia implements MediaAdapter {
  knex: knex;

  constructor(inputKnex: knex) {
    this.knex = inputKnex;
  }

  async create(media: Cotype.Media): Promise<void> {
    const search = this.createSearchString(media.originalname, media.tags);
    await this.knex("media").insert({ ...media, search });
  }

  async list({
    limit,
    offset,
    search,
    orderBy,
    order,
    mimetype
  }: Cotype.MediaListOpts): Promise<Cotype.ListChunk<Cotype.Media>> {
    const q = this.knex("media");

    if (mimetype) {
      q.where("mimetype", "LIKE", `%${mimetype}%`);
    }

    if (search) {
      const term = search.toLowerCase().trim();
      if (this.knex.client.config.client === "pg")
        q.whereRaw("search @@ plainto_tsquery(?)", `${term}:*`);
      else if (this.knex.client.config.client === "mysql") {
        q.whereRaw(
          "MATCH(search) AGAINST(? IN BOOLEAN MODE)",
          cleanSearchTerm(term)
        );
      } else {
        q.where("search", "like", `%${term}%`);
      }
    }

    const [count] = await q.clone().count("* as total");
    const items = await q
      .offset(Number(offset || 0))
      .limit(Number(limit || 50))
      .orderBy(orderBy || "created_at", order || "desc");

    return {
      total: Number(count.total),
      items: items.map((i: any) => ({ ...i, tags: JSON.parse(i.tags) }))
    };
  }

  async load(ids: string[]): Promise<Cotype.Media[]> {
    const media = await this.knex("media").whereIn("id", ids);
    media.forEach((m: Cotype.Media) => {
      m.tags = JSON.parse(m.tags as any);
    });
    return media;
  }
  async findByHash(hashs: string[]): Promise<Cotype.Media[]> {
    const media = await this.knex("media").whereIn("hash", hashs);
    media.forEach((m: Cotype.Media) => {
      m.tags = JSON.parse(m.tags as any);
    });
    return media;
  }

  async update(id: string, data: any) {
    const args = pick(data, ["focusX", "focusY", "tags", "alt", "credit"]);

    const [media] = await this.knex("media").where({ id });
    if (!media) return null;

    if (typeof args.focusX !== undefined && args.focusX !== null)
      args.focusX = parseInt(args.focusX, 10);

    if (typeof args.focusY !== undefined && args.focusY !== null)
      args.focusY = parseInt(args.focusY, 10);

    const search = this.createSearchString(media.originalname, args.tags);

    if (typeof args.tags !== undefined) {
      args.tags = JSON.stringify(args.tags);
    }

    return this.knex("media")
      .where({ id })
      .update({ ...args, search });
  }

  async delete(id: string, models: Cotype.Model[]): Promise<any> {
    const unnecessaryReferences: [] = await this.knex("content_references")
      .where("media", "=", id)
      .join("contents", join => {
        join.on("contents.id", "content_references.id");
        join.on(j => {
          j.on("contents.latest_rev", "<>", "content_references.rev");
          j.andOn("contents.published_rev", "<>", "content_references.rev");
        });
      })
      .where("contents.deleted", false);

    const deadReferences: [] = await this.knex("content_references")
      .join("contents", join => {
        join.on("contents.id", "content_references.id");
      })
      .whereNotIn("contents.type", models.map(m => m.name));

    const deletableRefs = unnecessaryReferences.concat(deadReferences);

    // Intentionally not using forEach here (async/await + forEach = probably not what you expect )
    for (const refKey in deletableRefs) {
      if (deletableRefs.hasOwnProperty(refKey)) {
        const { id: refId, rev, media }: any = deletableRefs[refKey];

        await this.knex("content_references")
          .where({ id: refId, rev, media })
          .del();
      }
    }

    // Check if it is referenced by other content:
    const [{ count }] = await this.knex("content_references")
      .where({ media: id })
      .join("contents", join => {
        join.on("contents.id", "content_references.id");
        join.on(j => {
          j.on("contents.latest_rev", "=", "content_references.rev");
          j.orOn("contents.published_rev", "=", "content_references.rev");
        });
      })
      .andWhere("contents.deleted", false)
      .count("* as count");

    if (count) throw new ReferenceConflictError({ type: "content" });

    // delete all unnecessary content references
    await this.knex("content_references")
      .andWhere("media", "=", id)
      .del();

    try {
      await this.knex("media")
        .where({ id })
        .del();
    } catch (err) {
      // Currently user pictures are the place where media could be referenced.
      // If this ever changes we have to either probe the various places or
      // extract the information from the thrown error like the PgMedia adapter does.
      throw new ReferenceConflictError({
        type: "settings",
        model: "users",
        field: "picture"
      });
    }
  }

  createSearchString(name: string, tags: string[] | null) {
    let search = "";
    if (tags) search = tags.join(" ");
    search += ` ${name}`;

    return search.toLowerCase();
  }
}
