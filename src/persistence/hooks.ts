import { Model } from "../../typings";
import bcrypt from "bcryptjs";

export type PostHook = (value: any) => any;
export type HookReturnValue = PostHook | void;
export type Hook = (...args: any[]) => HookReturnValue;
export interface Hooks {
  [key: string]: Hook;
}

function hashUserPassword(model: Model, data: any) {
  if (model.name === "users" && data.newPassword) {
    data.password = bcrypt.hashSync(data.newPassword, 10);
    delete data.newPassword;
  }
}

const settings: Hooks = {
  onCreate(model: Model, data: any) {
    hashUserPassword(model, data);
  },
  onSave(model: Model, data: any) {
    hashUserPassword(model, data);
  }
};

export default {
  settings
};
