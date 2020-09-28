import * as Cotype from "../../typings";
/**
 * Visitor to recursively walk through a content object.
 */
import _ from "lodash";

export const NO_STORE_VALUE = Symbol();

type Visitor = {
  [key: string]: (
    value: any,
    field: any,
    deleteFunc: () => void,
    stringPath: string
  ) => void | typeof NO_STORE_VALUE | any;
};

export default function visit(
  obj: any,
  model: Cotype.Model,
  visitor: Visitor,
  options?: {
    flattenList?: boolean;
    language?: string;
    calli18nMultipleTimes?: boolean;
  }
) {
  const opts: {
    flattenList: boolean;
    language?: string;
    calli18nMultipleTimes?: boolean;
  } = {
    flattenList: true,
    calli18nMultipleTimes: false,
    ...options
  };
  if (!obj) return;
  const walk = (
    m: Cotype.Type,
    value: any,
    key?: string,
    parent?: object,
    stringPath: string = ""
  ) => {
    if (!m) return;
    let parsedValue = value;
    if ("i18n" in m && m.i18n && opts.language && opts.language in value) {
      parsedValue = value[opts.language];
    }
    if (m.type === "object") {
      Object.keys(m.fields).forEach(fieldKey =>
        walk(
          m.fields[fieldKey],
          (value || {})[fieldKey],
          fieldKey,
          parsedValue,
          stringPath + key + "."
        )
      );
    }
    if (m.type === "list" && opts.flattenList) {
      if (Array.isArray(parsedValue))
        parsedValue.forEach((item, i: number) =>
          walk(m.item, item.value, String(i), value, stringPath + key + ".")
        );
    }
    if (m.type === "union") {
      if (parsedValue) {
        const { _type } = parsedValue;
        walk(
          m.types[_type],
          parsedValue,
          undefined,
          undefined,
          stringPath + key + "."
        );
      }
    }
    if (m.type === "immutable") {
      walk(m.child, parsedValue, key, parent, stringPath);
    }

    if ("i18n" in visitor && "i18n" in m && m.i18n) {
      const ret = visitor.i18n(
        value,
        m,
        () => {
          if (parent && key) {
            _.set(parent, key, undefined);
          }
        },
        Array.isArray(parent) ? stringPath.slice(0, -1) : stringPath + key // Remove Dot and ArrayKey when Parent is List
      );
      if (typeof ret !== "undefined") {
        if (parent && key) {
          _.set(parent, key, ret);
          parsedValue = ret;
        }
      }
    }
    if (m.type in visitor) {
      const innerVisitor = (v: any, k: string) => {
        const ret = visitor[m.type](
          v,
          m,
          () => {
            if (parent && key) {
              _.set(parent, k, undefined);
            }
          },
          Array.isArray(parent) ? stringPath.slice(0, -1) : stringPath + k // Remove Dot and ArrayKey when Parent is List
        );
        if (typeof ret !== "undefined") {
          if (parent && key) {
            if (ret === NO_STORE_VALUE) {
              return _.set(parent, k, undefined);
            }
            _.set(parent, k, ret);
          }
        }
      };
      if ("i18n" in m && m.i18n && opts.calli18nMultipleTimes && parsedValue) {
        Object.entries(parsedValue).forEach(([lKey, v]) => {
          innerVisitor(v, key + "." + lKey);
        });
      } else {
        innerVisitor(parsedValue, key || "");
      }
    }
  };
  Object.keys(model.fields).forEach(key =>
    walk(model.fields[key], obj[key] || (obj.data && obj.data[key]), key, obj)
  );
}
