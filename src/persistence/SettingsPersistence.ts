import * as Cotype from "../../typings";

/**
 * The part of the persistence layer that handles settings (users, roles, etCotype.)
 */

import { checkPermissions, Permission } from "../auth/acl";
import { SettingsAdapter } from "./adapter";
import hooks from "./hooks";
import applyHooksFactory from "./applyHooks";

/**
 * Turns a settings record into an `Item` to display it in generic lists.
 */
function itemFactory(model: Cotype.Model) {
  return (record: Cotype.Settings) => {
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
  adapter: SettingsAdapter;
  models: Cotype.Model[];
  applyHooks: (...args: any[]) => any;

  constructor(adapter: SettingsAdapter, models: Cotype.Model[]) {
    this.adapter = adapter;
    this.models = models;
    this.applyHooks = applyHooksFactory(hooks.settings);
  }

  getModel(name: string) {
    return this.models.find(
      m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
  }

  create(principal: Cotype.Principal, model: Cotype.Model, data: object) {
    checkPermissions(principal, model, Permission.edit);

    return this.applyHooks(
      ["onCreate"],
      [model, data],
      this.adapter.create.bind(this.adapter)
    );
  }

  load(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string
  ): Promise<Cotype.Settings> {
    checkPermissions(principal, model, Permission.view);

    if (model.name === "users") return this.loadUser(id);

    return this.applyHooks(
      ["onLoad"],
      [model, id],
      this.adapter.load.bind(this.adapter)
    );
  }

  find(
    principal: Cotype.Principal,
    model: Cotype.Model,
    field: string,
    value: any
  ): Promise<Cotype.Settings> {
    checkPermissions(principal, model, Permission.view);
    return this.adapter.find(model, field, value);
  }

  async findItem(
    principal: Cotype.Principal,
    model: Cotype.Model,
    field: string,
    value: any
  ): Promise<Cotype.Item> {
    checkPermissions(principal, model, Permission.view);
    const record = await this.adapter.find(model, field, value);
    return itemFactory(model)(record);
  }

  async loadItem(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string
  ): Promise<Cotype.Item> {
    checkPermissions(principal, model, Permission.view);

    const record = await this.adapter.load(model, id);
    return itemFactory(model)(record);
  }

  async list(
    principal: Cotype.Principal,
    model: Cotype.Model,
    opts: Cotype.ListOpts
  ): Promise<Cotype.ListChunk<Cotype.Item>> {
    checkPermissions(principal, model, Permission.view);
    const { total, items } = await this.adapter.list(model, opts);
    return {
      total,
      items: items.map(itemFactory(model))
    };
  }

  async update(
    principal: Cotype.Principal,
    model: Cotype.Model,
    id: string,
    data: object
  ): Promise<Cotype.Settings> {
    checkPermissions(principal, model, Permission.edit);

    await this.applyHooks(["onSave"], [model, data], () => {
      return this.adapter.update(model, id, data);
    });

    return {
      id,
      ...data
    };
  }

  delete(principal: Cotype.Principal, model: Cotype.Model, id: string) {
    checkPermissions(principal, model, Permission.edit);

    if (model.name === "users") {
      return this.adapter.deleteUser(id);
    }
    return this.adapter.delete(model, id);
  }

  loadUser(id: string): Promise<Cotype.User> {
    return this.adapter.loadUser(id);
  }

  findUserByEmail(email: string) {
    return this.adapter.findUserByEmail(email);
  }
}
