import { Model, ListOpts } from "../../../../typings";

import knex from "knex";
import { SettingsAdapter } from "..";

export default class KnexSettings implements SettingsAdapter {
  knex: knex;

  constructor(inputKnex: knex) {
    this.knex = inputKnex;
  }

  table(model: Model) {
    const name = model.name;
    return this.knex(name);
  }

  async create(model: Model, data: object) {
    const [id] = await this.table(model)
      .insert(this.serialize(model, data))
      .returning("id");
    return id;
  }

  async load(model: Model, id: string) {
    const [record] = await this.table(model).where({ id });
    return this.deserialize(model, record);
  }

  async find(model: Model, field: string, value: any) {
    const [record] = await this.table(model)
      .where({ [field]: value })
      .limit(1);
    return this.deserialize(model, record);
  }

  async list(model: Model, opts: ListOpts) {
    const { search, offset, limit } = opts;
    const q = this.table(model);

    if (model.name === "users") {
      q.whereNot("deleted", true);
    }
    if (search) {
      q.where(search.prop || model.title, "LIKE", search.term + "%");
    }

    const [count] = await q.clone().count("* as total");
    const items = await q
      .offset(Number(offset || 0))
      .limit(Number(limit || 50));
    return {
      total: Number(count.total),
      items: items.map((item: any) => this.deserialize(model, item))
    };
  }

  async update(model: Model, id: string, data: object) {
    await this.table(model)
      .where({ id })
      .update(this.serialize(model, data));
  }

  async delete(model: Model, id: string) {
    try {
      return await this.table(model)
        .where({ id })
        .del();
    } catch (error) {
      throw new Error(
        `Sorry! Cannot delete this ${
          model.singular
        } hence it seems it is still in use!`
      );
    }
  }

  async deleteUser(id: string) {
    await this.knex("users")
      .where({ id })
      .update({ deleted: true, role: null });
  }

  async loadUser(id: string) {
    const [user] = await this.knex("users")
      .join("roles", "users.role", "roles.id")
      .select(
        "users.id",
        "users.name",
        "users.email",
        "users.role",
        "users.picture",
        "roles.permissions"
      )
      .where({ "users.id": id, "users.deleted": false })
      .limit(1)
      .select();

    return this.deserializeUser(user);
  }

  async findUserByEmail(email: string) {
    return await this.knex("users")
      .where({ email, deleted: false })
      .first();
  }

  // Private Methods

  private deserializeUser(record: any) {
    const user = this.parse(record, ["permissions"]);
    if (user && !("preview" in user.permissions)) {
      // Default to `true` for legacy users
      user.permissions.preview = true;
    }
    return user;
  }

  private stringify(data: any, jsonProps: string[]) {
    const ret: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (jsonProps.includes(key)) value = JSON.stringify(value);
      ret[key] = value;
    });
    return ret;
  }

  private parse(data: any, jsonProps: string[]) {
    if (!data) return null;
    const ret: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (jsonProps.includes(key) && typeof value === "string") {
        value = JSON.parse(value);
      }
      ret[key] = value;
    });
    return ret;
  }

  private getJsonProps(model: Model) {
    if (model.name === "roles") {
      return ["permissions"];
    }
    return [];
  }

  private serialize(model: Model, data: any) {
    return this.stringify(data, this.getJsonProps(model));
  }

  private deserialize(model: Model, data: any) {
    return this.parse(data, this.getJsonProps(model));
  }
}
