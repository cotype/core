/**
 * Helpers to build a Swagger/OpenAPI spec.
 */
import { Model, Type } from "../../typings";
import { OpenApiBuilder, SchemaObject, ReferenceObject, ParameterObject } from "openapi3-ts";
declare const stringType: {
    type: string;
};
declare const booleanType: {
    type: string;
};
declare const float: {
    type: string;
};
declare const integer: {
    type: string;
};
export { stringType as string, booleanType as boolean, float, integer };
export declare const media: {
    type: string;
    properties: {
        _id: {
            type: string;
        };
        _ref: {
            type: string;
            enum: string[];
        };
        _src: {
            type: string;
        };
    };
    required: string[];
};
export declare const scalars: SchemaObject;
export declare const empty: {};
export declare const ref: ((comp: string) => ReferenceObject) & {
    response: (name: string) => ReferenceObject;
    schema: (name: string) => ReferenceObject;
    param: (name: string) => ReferenceObject;
    params: (...names: string[]) => ReferenceObject[];
};
type Props = {
    [index: string]: SchemaObject | ReferenceObject;
};
export declare const object: ((properties: Props) => SchemaObject) & {
    required: (...required: string[]) => (properties: Props) => {
        type: string;
        required: string[];
        properties: Props;
    };
};
export declare function array(items: object): {
    type: string;
    items: object;
};
export declare const param: ((name: string, opts?: Partial<ParameterObject>) => ParameterObject) & {
    query: (name: string, opts?: Partial<ParameterObject>) => ParameterObject;
};
export declare function body(props: Props): {
    content: {
        "application/json": {
            schema: SchemaObject;
        };
    };
};
export declare function createDefinition(model: Type, external: boolean, api: OpenApiBuilder): SchemaObject;
export declare function modelSchema(model: Model, external: boolean, api: OpenApiBuilder): {
    type: string;
    properties: {
        [x: string]: SchemaObject;
    };
    required: string[];
};
export declare function addModel(api: OpenApiBuilder, model: Model): ReferenceObject;
export declare function addExternalModel(api: OpenApiBuilder, model: Model): ReferenceObject;
export declare const toTypeName: (name: string) => string;
