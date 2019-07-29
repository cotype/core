import { ContentAdapter } from "./adapter";
import { Model } from "../../typings";

export default class MigrationContext {
  adapter: ContentAdapter;
  models: Model[];

  constructor(adapter: ContentAdapter, models: Model[]) {
    this.adapter = adapter;
    this.models = models;
  }

  rewrite(modelName: string, iterator: (data: any, meta: any) => void) {
    const model = this.models.find(m => m.name === modelName);
    if (!model) throw new Error(`No such model: ${modelName}`);
    return this.adapter.rewrite(model, this.models, iterator);
  }
}
