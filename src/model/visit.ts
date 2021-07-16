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
    stringPath: string,
    langKey?: string
  ) => void | typeof NO_STORE_VALUE | any;
};

export default function visit(
  obj: any,
  model: Cotype.Model,
  visitor: Visitor,
  options?: {
    flattenList?: boolean;
    withI18nFlag?: boolean;
  }
) {
  const opts: {
    flattenList: boolean;
    withI18nFlag?: boolean;
  } = {
    flattenList: true,
    withI18nFlag: false,
    ...options
  };
  if (!obj) return;
  const walk = (
    m: Cotype.Type,
    value: any,
    key?: string,
    parent?: object,
    stringPath: string = "",
    langKey?: string
  ) => {
    if (!m) return;

    if ("i18n" in m && m.i18n) {
      if (model.languages) {
        if ("i18n" in visitor) {
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
            }
          }
        }
        model.languages.map(l => {
          walk(
            {
              ...m,
              i18n: false
            },
            (value || {})[l.key],
            opts.withI18nFlag ? l.key : key,
            opts.withI18nFlag ? value : parent,
            stringPath + (opts.withI18nFlag ? `${l.key}.` : ""),
            l.key
          );
        });
        return;
      }
    }
    if (m.type === "object") {
      Object.keys(m.fields).forEach(fieldKey =>
        walk(
          m.fields[fieldKey],
          (value || {})[fieldKey],
          fieldKey,
          value,
          stringPath + key + ".",
          langKey
        )
      );
    }
    if (m.type === "list" && opts.flattenList) {
      if (Array.isArray(value))
        value.forEach((item, i: number) =>
          walk(
            m.item,
            item.value || item,
            String(i),
            value,
            stringPath + key + ".",
            langKey
          )
        );
    }
    if (m.type === "union") {
      if (value) {
        const { _type } = value;
        walk(
          m.types[_type],
          value,
          key,
          parent,
          stringPath + key + ".",
          langKey
        );
      }
    }
    if (m.type === "immutable") {
      walk(m.child, value, key, parent, stringPath, langKey);
    }
    if (m.type in visitor) {
      const ret = visitor[m.type](
        value,
        m,
        () => {
          if (parent && key) {
            _.set(parent, key, undefined);
          }
        },
        Array.isArray(parent) ? stringPath.slice(0, -1) : stringPath + key, // Remove Dot and ArrayKey when Parent is List,
        langKey
      );
      if (typeof ret !== "undefined") {
        if (parent && key) {
          if (ret === NO_STORE_VALUE) {
            return _.set(parent, key, undefined);
          }
          _.set(parent, key, ret);
        }
      }
    }
  };
  Object.keys(model.fields).forEach(key =>
    walk(model.fields[key], obj[key] || (obj.data && obj.data[key]), key, obj)
  );
}
