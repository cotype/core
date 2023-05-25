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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The part of the persistence layer that handles settings (users, roles, etCotype.)
 */
const acl_1 = require("../auth/acl");
const hooks_1 = __importDefault(require("./hooks"));
const applyHooks_1 = __importDefault(require("./applyHooks"));
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
class SettingsPersistence {
    constructor(adapter, models) {
        this.adapter = adapter;
        this.models = models;
        this.applyHooks = (0, applyHooks_1.default)(hooks_1.default.settings);
    }
    getModel(name) {
        return this.models.find(m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    }
    create(principal, model, data) {
        (0, acl_1.checkPermissions)(principal, model, acl_1.Permission.edit);
        return this.applyHooks(["onCreate"], [model, data], this.adapter.create.bind(this.adapter));
    }
    load(principal, model, id) {
        (0, acl_1.checkPermissions)(principal, model, acl_1.Permission.view);
        if (model.name === "users")
            return this.loadUser(id);
        return this.applyHooks(["onLoad"], [model, id], this.adapter.load.bind(this.adapter));
    }
    find(principal, model, field, value) {
        (0, acl_1.checkPermissions)(principal, model, acl_1.Permission.view);
        return this.adapter.find(model, field, value);
    }
    findItem(principal, model, field, value) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, acl_1.checkPermissions)(principal, model, acl_1.Permission.view);
            const record = yield this.adapter.find(model, field, value);
            return itemFactory(model)(record);
        });
    }
    loadItem(principal, model, id) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, acl_1.checkPermissions)(principal, model, acl_1.Permission.view);
            const record = yield this.adapter.load(model, id);
            return itemFactory(model)(record);
        });
    }
    list(principal, model, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, acl_1.checkPermissions)(principal, model, acl_1.Permission.view);
            const { total, items } = yield this.adapter.list(model, opts);
            return {
                total,
                items: items.map(itemFactory(model))
            };
        });
    }
    update(principal, model, id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, acl_1.checkPermissions)(principal, model, acl_1.Permission.edit);
            yield this.applyHooks(["onSave"], [model, data], () => {
                return this.adapter.update(model, id, data);
            });
            return Object.assign({ id }, data);
        });
    }
    delete(principal, model, id) {
        (0, acl_1.checkPermissions)(principal, model, acl_1.Permission.edit);
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
exports.default = SettingsPersistence;
//# sourceMappingURL=SettingsPersistence.js.map