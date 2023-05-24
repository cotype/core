/// <reference types="superagent" />
import request from "supertest";
export declare function createApiReadHelpers(server: request.SuperTest<request.Test>): {
    find: (type: string, id: string, params?: object, published?: boolean) => Promise<any>;
    list: (type: string, params?: object, published?: boolean) => Promise<any>;
    search: (term: string, opts: {
        published?: boolean;
        linkableOnly?: boolean;
        includeModels?: string[];
        excludeModels?: string[];
        limit?: number;
        offset?: number;
    }) => Promise<any>;
    findByField: (type: string, field: string, value: string, params?: object, published?: boolean) => Promise<any>;
    suggest: (term: string, opts: {
        published?: boolean;
        linkableOnly?: boolean;
        includeModels?: string[];
        excludeModels?: string[];
    }) => Promise<any>;
};
export declare function createApiWriteHelpers(server: request.SuperTest<request.Test>, headers: object): {
    create: (type: string, data: object) => Promise<any>;
    update: (type: string, id: string, data: object) => Promise<any>;
    schedule: (type: string, id: string, data: {
        visibleFrom?: Date | string | null;
        visibleUntil?: Date | string | null;
    }) => Promise<any>;
    publish: (type: string, id: string) => Promise<import("superagent").Response>;
};
