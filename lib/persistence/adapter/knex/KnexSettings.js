"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class KnexSettings {
    knex;
    constructor(inputKnex) {
        this.knex = inputKnex;
    }
    table(model) {
        const name = model.name;
        return this.knex(name);
    }
    async create(model, data) {
        const [id] = await this.table(model)
            .insert(this.serialize(model, data))
            .returning("id");
        return id;
    }
    async load(model, id) {
        const [record] = await this.table(model).where({ id });
        return this.deserialize(model, record);
    }
    async find(model, field, value) {
        const [record] = await this.table(model)
            .where({ [field]: value })
            .limit(1);
        return this.deserialize(model, record);
    }
    async list(model, opts) {
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
            items: items.map((item) => this.deserialize(model, item))
        };
    }
    async update(model, id, data) {
        await this.table(model)
            .where({ id })
            .update(this.serialize(model, data));
    }
    async delete(model, id) {
        try {
            return await this.table(model)
                .where({ id })
                .del();
        }
        catch (error) {
            throw new Error(`Sorry! Cannot delete this ${model.singular} hence it seems it is still in use!`);
        }
    }
    async deleteUser(id) {
        await this.knex("users")
            .where({ id })
            .update({ deleted: true, role: null });
    }
    async loadUser(id) {
        const [user] = await this.knex("users")
            .join("roles", "users.role", "roles.id")
            .select("users.id", "users.name", "users.email", "users.role", "users.picture", "roles.permissions")
            .where({ "users.id": id, "users.deleted": false })
            .limit(1)
            .select();
        return this.deserializeUser(user);
    }
    async findUserByEmail(email) {
        return await this.knex("users")
            .where({ email, deleted: false })
            .first();
    }
    // Private Methods
    deserializeUser(record) {
        const user = this.parse(record, ["permissions"]);
        if (user && !("preview" in user.permissions)) {
            // Default to `true` for legacy users
            user.permissions.preview = true;
        }
        return user;
    }
    stringify(data, jsonProps) {
        const ret = {};
        Object.entries(data).forEach(([key, value]) => {
            if (jsonProps.includes(key))
                value = JSON.stringify(value);
            ret[key] = value;
        });
        return ret;
    }
    parse(data, jsonProps) {
        if (!data)
            return null;
        const ret = {};
        Object.entries(data).forEach(([key, value]) => {
            if (jsonProps.includes(key) && typeof value === "string") {
                value = JSON.parse(value);
            }
            ret[key] = value;
        });
        return ret;
    }
    getJsonProps(model) {
        if (model.name === "roles") {
            return ["permissions"];
        }
        return [];
    }
    serialize(model, data) {
        return this.stringify(data, this.getJsonProps(model));
    }
    deserialize(model, data) {
        return this.parse(data, this.getJsonProps(model));
    }
}
exports.default = KnexSettings;
//# sourceMappingURL=KnexSettings.js.map