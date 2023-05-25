/**
 * The part of the persistence layer that handles settings (users, roles, etCotype.)
 */
import { checkPermissions, Permission } from "../auth/acl";
import hooks from "./hooks";
import applyHooksFactory from "./applyHooks";
/**
 * Turns a settings record into an `Item` to display it in generic lists.
 */
function itemFactory(model) {
    return (record) => {
        const { type, name, title, image, singular } = model;
        return {
            id: record.id,
            type,
            model: name,
            title: title && record[title],
            image: image && record[image],
            kind: singular
        };
    };
}
export default class SettingsPersistence {
    constructor(adapter, models) {
        this.adapter = adapter;
        this.models = models;
        this.applyHooks = applyHooksFactory(hooks.settings);
    }
    getModel(name) {
        return this.models.find(m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    }
    create(principal, model, data) {
        checkPermissions(principal, model, Permission.edit);
        return this.applyHooks(["onCreate"], [model, data], this.adapter.create.bind(this.adapter));
    }
    load(principal, model, id) {
        checkPermissions(principal, model, Permission.view);
        if (model.name === "users")
            return this.loadUser(id);
        return this.applyHooks(["onLoad"], [model, id], this.adapter.load.bind(this.adapter));
    }
    find(principal, model, field, value) {
        checkPermissions(principal, model, Permission.view);
        return this.adapter.find(model, field, value);
    }
    async findItem(principal, model, field, value) {
        checkPermissions(principal, model, Permission.view);
        const record = await this.adapter.find(model, field, value);
        return itemFactory(model)(record);
    }
    async loadItem(principal, model, id) {
        checkPermissions(principal, model, Permission.view);
        const record = await this.adapter.load(model, id);
        return itemFactory(model)(record);
    }
    async list(principal, model, opts) {
        checkPermissions(principal, model, Permission.view);
        const { total, items } = await this.adapter.list(model, opts);
        return {
            total,
            items: items.map(itemFactory(model))
        };
    }
    async update(principal, model, id, data) {
        checkPermissions(principal, model, Permission.edit);
        await this.applyHooks(["onSave"], [model, data], () => {
            return this.adapter.update(model, id, data);
        });
        return Object.assign({ id }, data);
    }
    delete(principal, model, id) {
        checkPermissions(principal, model, Permission.edit);
        if (model.name === "users") {
            return this.adapter.deleteUser(id);
        }
        return this.adapter.delete(model, id);
    }
    loadUser(id) {
        return this.adapter.loadUser(id);
    }
    findUserByEmail(email) {
        return this.adapter.findUserByEmail(email);
    }
}
//# sourceMappingURL=SettingsPersistence.js.map