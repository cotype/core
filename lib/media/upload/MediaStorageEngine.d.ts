import { StorageEngine } from "multer";
import Storage from "../storage/Storage";
export default class MediaStorageEngine implements StorageEngine {
    storage: Storage;
    constructor(storage: Storage);
    generateFilename(originalname: string): string;
    _handleFile(req: Express.Request, file: any, cb: (error?: any, info?: any) => void): Promise<void>;
    _removeFile(req: Express.Request, file: Express.Multer.File, cb: (err: any) => void): Promise<void>;
}
