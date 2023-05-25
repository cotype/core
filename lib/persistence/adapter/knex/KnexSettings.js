"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class KnexSettings {
    constructor(inputKnex) {
        this.knex = inputKnex;
    }
    table(model) {
        const name = model.name;
        return this.knex(name);
    }
    create(model, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [id] = yield this.table(model)
                .insert(this.serialize(model, data))
                .returning("id");
            return id;
        });
    }
    load(model, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [record] = yield this.table(model).where({ id });
            return this.deserialize(model, record);
        });
    }
    find(model, field, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const [record] = yield this.table(model)
                .where({ [field]: value })
                .limit(1);
            return this.deserialize(model, record);
        });
    }
    list(model, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { search, offset, limit } = opts;
            const q = this.table(model);
            if (model.name === "users") {
                q.whereNot("deleted", true);
            }
            if (search) {
                q.where(search.prop || model.title, "LIKE", search.term + "%");
            }
            const [count] = yield q.clone().count("* as total");
            const items = yield q
                .offset(Number(offset || 0))
                .limit(Number(limit || 50));
            return {
                total: Number(count.total),
                items: items.map((item) => this.deserialize(model, item))
            };
        });
    }
    update(model, id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.table(model)
                .where({ id })
                .update(this.serialize(model, data));
        });
    }
    delete(model, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.table(model)
                    .where({ id })
                    .del();
            }
            catch (error) {
                throw new Error(`Sorry! Cannot delete this ${model.singular} hence it seems it is still in use!`);
            }
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.knex("users")
                .where({ id })
                .update({ deleted: true, role: null });
        });
    }
    loadUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [user] = yield this.knex("users")
                .join("roles", "users.role", "roles.id")
                .select("users.id", "users.name", "users.email", "users.role", "users.picture", "roles.permissions")
                .where({ "users.id": id, "users.deleted": false })
                .limit(1)
                .select();
            return this.deserializeUser(user);
        });
    }
    findUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.knex("users")
                .where({ email, deleted: false })
                .first();
        });
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