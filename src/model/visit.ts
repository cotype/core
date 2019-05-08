import * as Cotype from "../../typings";
/**
 * Visitor to recursively walk through a content object.
 */
import _ from "lodash";

type Visitor = {
  [key: string]: (
    value: any,
    field: any,
    deleteFunc: () => void,
    stringPath: string
  ) => void;
};

export default function visit(
  obj: any,
  model: Cotype.Model,
  visitor: Visitor,
  options?: { flattenList?: boolean }
) {
  const opts = {
    flattenList: true,
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
    if (m.type === "object") {
      Object.keys(m.fields).forEach(fieldKey =>
        walk(
          m.fields[fieldKey],
          (value || {})[fieldKey],
          fieldKey,
          value,
          stringPath + key + "."
        )
      );
    }
    if (m.type === "list" && opts.flattenList) {
      if (Array.isArray(value))
        value.forEach((item, i: number) =>
          walk(m.item, item.value, String(i), value, stringPath + key + ".")
        );
    }
    if (m.type === "union") {
      if (value) {
        const { _type } = value;
        walk(
          m.types[_type],
          value,
          undefined,
          undefined,
          stringPath + key + "."
        );
      }
    }
    if (m.type === "immutable") {
      walk(m.child, value, key, parent, stringPath);
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
        stringPath + key
      );
      if (typeof ret !== "undefined") {
        if (parent && key) _.set(parent, key, ret);
      }
    }
  };
  Object.keys(model.fields).forEach(key =>
    walk(model.fields[key], obj[key] || (obj.data && obj.data[key]), key, obj)
  );
}
