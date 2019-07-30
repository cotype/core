import _ from "lodash";
import { ContentPersistence } from "..";
import { RewriteIterator } from "./ContentPersistence";

export default class MigrationContext {
  content: ContentPersistence;

  constructor(content: ContentPersistence) {
    this.content = content;
  }

  rewrite(modelName: string, iterator: RewriteIterator) {
    return this.content.rewrite(modelName, iterator);
  }

  addField(modelName: string, fieldPath: string, defaultValue: any) {
    this.rewrite(modelName, (data, meta) => {
      const value =
        typeof defaultValue === "function"
          ? defaultValue(data, meta)
          : defaultValue;
      _.set(data, fieldPath, value);

      return data;
    });
  }
}
