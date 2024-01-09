/// <reference types="node" />
/// <reference types="node" />
import fs from "fs-extra";
import Storage from "./Storage";
export default class FsStorage implements Storage {
    uploadDir: string;
    constructor(uploadDir: string);
    getFile(id: string): string;
    store(id: string, stream: NodeJS.ReadableStream): Promise<number>;
    retrieve(id: string): fs.ReadStream;
    exists(id: string): Promise<boolean>;
    getUrl(id: string): string;
    remove(id: string): Promise<void>;
}
