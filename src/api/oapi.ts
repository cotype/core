/**
 * Helpers to build a Swagger/OpenAPI spec.
 */
import { Model, Type } from "../../typings";
import _, { isEqual } from "lodash";
import {
  OpenApiBuilder,
  SchemaObject,
  ReferenceObject,
  ParameterObject
} from "openapi3-ts";
import * as changeCase from "change-case";

const stringType = { type: "string" };
const booleanType = { type: "boolean" };
const float = { type: "number" };
const integer = { type: "integer" };

export { stringType as string, booleanType as boolean, float, integer };

export const media = {
  type: "object",
  properties: {
    _id: { type: "string" },
    _ref: { type: "string", enum: ["media"] },
    _src: { type: "string" }
  },
  required: ["_id", "_ref", "_src"]
};

export const scalars: SchemaObject = {
  string: stringType,
  position: stringType,
  date: stringType,
  boolean: booleanType,
  number: float
};

export const empty = {};

export const ref = Object.assign(
  (comp: string): ReferenceObject => ({ $ref: `#/components/${comp}` }),
  {
    response: (name: string) => ref(`responses/${name}`),
    schema: (name: string) => ref(`schemas/${name}`),
    param: (name: string) => ref(`parameters/${name}`),
    params: (...names: string[]) => names.map(ref.param)
  }
);

type Props = {
  [index: string]: SchemaObject | ReferenceObject;
};
export const object = Object.assign(
  (properties: Props): SchemaObject => ({ type: "object", properties }),
  {
    required: (...required: string[]) => (properties: Props) => ({
      type: "object",
      required,
      properties
    })
  }
);

export function array(items: object) {
  return { type: "array", items };
}

function paramBuilder(defaults: Partial<ParameterObject>) {
  return (name: string, opts?: Partial<ParameterObject>): ParameterObject => {
    return { name, in: "path", ...defaults, ...opts };
  };
}

export const param = Object.assign(paramBuilder({ required: true }), {
  query: paramBuilder({ in: "query" })
});

export function body(props: Props) {
  return {
    content: {
      "application/json": {
        schema: object(props)
      }
    }
  };
}
const refs: { [key: string]: SchemaObject } = {};
export function createDefinition(
  model: Type,
  external: boolean,
  api: OpenApiBuilder
): SchemaObject {
  if (!model) return empty;
  if (model.type in scalars) return scalars[model.type];
  if (model.type === "object") {
    const schema = {
      type: "object",
      properties: _.mapValues(model.fields, field =>
        createDefinition(field, external, api)
      ),
      required: Object.entries(model.fields)
        .map(([key, value]) =>
          ((value as any).type === "virtual" && (value as any).get) ||
          (value as any).required
            ? key
            : null
        )
        .filter(Boolean) as string[]
    };
    if (model.typeName) {
      const typeName = toTypeName(model.typeName);
      if (!refs[typeName]) {
        api.addSchema(typeName, schema);
        refs[typeName] = schema;
      } else {
        if (!isEqual(refs[typeName], schema)) {
          throw new Error(
            `Object key "typeName" is used for different element: ${typeName}`
          );
        }
      }
      return ref.schema(toTypeName(model.typeName));
    }
    return schema;
  }

  if (model.type === "richtext") {
    if (external) return stringType;
    return {
      type: "object",
      properties: {}
    };
  }

  if (model.type === "content") {
    if (external)
      return {
        type: "object",
        properties: {
          _id: { type: "string" },
          _ref: { type: "string", enum: [model.type] },
          _content: {
            type: "string",
            enum:
              ("models" in model && model.models && model.models.length) ||
              model.model
                ? [
                    ...(("models" in model && model.models) || [model.model] ||
                      [])
                  ]
                : undefined
          },
          _url: { type: "string" }
        },
        required: ["_id", "_ref", "_content"]
      };

    return {
      type: "object",
      properties: {
        id: { type: "number" },
        model: { type: "string" }
      }
    };
  }

  if (model.type === "references") {
    return array({
      type: "object",
      properties: {
        _id: { type: "string" },
        _ref: { type: "string", enum: ["content"] },
        _content: {
          type: "string",
          enum: [model.model]
        },
        _url: { type: "string" }
      },
      required: ["_id", "_ref", "_content"]
    });
  }

  if (model.type === "settings") {
    return {
      type: "string",
      description: `${model.model} id`
    };
  }

  if (model.type === "media") {
    return media;
  }

  if (model.type === "union") {
    return {
      oneOf: Object.entries(model.types).map(([name, type]) => {
        const def = createDefinition(type, external, api);
        _.set(def, "properties._type", { type: "string", enum: [name] });
        _.set(def, "required", [...(def.required || []), "_type"]);
        return def;
      }),
      discriminator: {
        propertyName: "_type"
      }
    };
  }

  if (model.type === "list") {
    if (external) {
      const schema = array(createDefinition(model.item, external, api));
      if (model.typeName) {
        const typeName = toTypeName(model.typeName);
        if (!refs[typeName]) {
          api.addSchema(typeName, schema);
          refs[typeName] = schema;
        } else {
          if (!isEqual(refs[typeName], schema)) {
            throw new Error(
              `List key "typeName" is used for different element: ${typeName}`
            );
          }
        }
        return ref.schema(toTypeName(model.typeName));
      }
      return schema;
    }

    return array({
      type: "object",
      properties: {
        key: { type: "number" },
        value: createDefinition(model.item, external, api)
      }
    });
  }

  if (model.type === "immutable") {
    return createDefinition(model.child, external, api);
  }

  if (model.type === "virtual") {
    if (!model.get) {
      return empty;
    }
    return {
      type: model.outputType
    };
  }

  return ref.schema(model.type);
}

export function modelSchema(
  model: Model,
  external: boolean,
  api: OpenApiBuilder
) {
  return {
    type: "object",
    properties: _.mapValues(model.fields, field =>
      createDefinition(field, external, api)
    ),
    required: Object.entries(model.fields)
      .map(([key, value]) =>
        ((value as any).type === "virtual" && (value as any).get) ||
        (value as any).required
          ? key
          : null
      )
      .filter(Boolean) as string[]
  };
}

export function addModel(api: OpenApiBuilder, model: Model) {
  const TypeName = toTypeName(model.name);
  api.addSchema(TypeName, modelSchema(model, false, api));
  return ref.schema(TypeName);
}

export function addExternalModel(api: OpenApiBuilder, model: Model) {
  const TypeName = toTypeName(model.name);
  api.addSchema(TypeName, modelSchema(model, true, api));
  return ref.schema(TypeName);
}

export const toTypeName = (name: string) => {
  return changeCase.pascalCase(name);
};
