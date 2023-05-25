import _ from "lodash";
export default class MigrationContext {
    constructor(content) {
        this.content = content;
    }
    rewrite(modelName, iterator) {
        return this.content.rewrite(modelName, iterator);
    }
    addField(modelName, fieldPath, defaultValue) {
        return this.rewrite(modelName, async (data, meta) => {
            const value = typeof defaultValue === "function"
                ? defaultValue(data, meta)
                : defaultValue;
            _.set(data, fieldPath, value);
            return data;
        });
    }
    removeField(modelName, fieldPath) {
        return this.rewrite(modelName, async (data) => {
            _.unset(data, fieldPath);
            return data;
        });
    }
}
//# sourceMappingURL=MigrationContext.js.map