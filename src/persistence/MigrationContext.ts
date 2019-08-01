import _ from "lodash";
import { ContentPersistence } from "..";
import { RewriteDataIterator } from "../../typings";

export default class MigrationContext {
  content: ContentPersistence;

  constructor(content: ContentPersistence) {
    this.content = content;
  }

  rewrite(modelName: string, iterator: RewriteDataIterator) {
    return this.content.rewrite(modelName, iterator);
  }

  addField(
    modelName: string,
    fieldPath: string,
    defaultValue: RewriteDataIterator | object | any[] | string | number
  ) {
    return this.rewrite(modelName, async (data, meta) => {
      const value =
        typeof defaultValue === "function"
          ? defaultValue(data, meta)
          : defaultValue;
      _.set(data, fieldPath, value);
      return data;
    });
  }

      return data;
    });
  }
}
