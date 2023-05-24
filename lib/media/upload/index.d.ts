/// <reference types="qs" />
/// <reference types="express" />
import Storage from "../storage/Storage";
export default function uploadHandler(storage: Storage): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
