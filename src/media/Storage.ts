import { RequestHandler } from "express";

type DynamicUpload = {
  dynamic: true;
  getUploadUrl: () => string | Promise<string>;
};

type StaticUpload = {
  dynamic: false;
};

export default interface Storage {
  readonly upload: (DynamicUpload | StaticUpload) & {
    getHandler(): RequestHandler | RequestHandler[] | null;
  };
  store(id: string, stream: NodeJS.ReadableStream): Promise<number>;
  retrieve(id: string): NodeJS.ReadableStream;
  getUrl(id: string): string;
  exists(id: string): Promise<boolean>;
  remove(id: string): Promise<void>;
}
