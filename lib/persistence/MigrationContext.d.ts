import { ContentPersistence } from "..";
import { RewriteDataIterator } from "./ContentPersistence";
export default class MigrationContext {
    content: ContentPersistence;
    constructor(content: ContentPersistence);
    rewrite(modelName: string, iterator: RewriteDataIterator): Promise<void>;
    addField(modelName: string, fieldPath: string, defaultValue: RewriteDataIterator | object | any[] | string | number): Promise<void>;
    removeField(modelName: string, fieldPath: string): Promise<void>;
}
