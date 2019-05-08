import * as Cotype from "../../../typings";
/**
 * Visitor to recursively walk through a content object.
 */
import _ from "lodash";

type Visitor = {
  [key: string]: (value: any, field: any) => void;
};

export default function visit(obj: any, model: Cotype.Model, visitor: Visitor) {
  if (!obj) return;
  const walk = (m: Cotype.Type, value: any, key?: string, parent?: object) => {
    if (!m) return;
    if (m.type === "object") {
      Object.keys(m.fields).forEach(fieldKey =>
        walk(m.fields[fieldKey], (value || {})[fieldKey], fieldKey, value)
      );
    }
    if (m.type === "list") {
      if (Array.isArray(value))
        value.forEach((item, i: number) =>
          walk(m.item, item, String(i), value)
        );
    }
    if (m.type === "union") {
      if (value) {
        const { _type } = value;
        walk(m.types[_type], value);
      }
    }
    if (m.type in visitor) {
      const ret = visitor[m.type](value, m);
      if (typeof ret !== "undefined") {
        if (parent && key) _.set(parent, key, ret);
      }
    }
  };
  Object.keys(model.fields).forEach(key =>
    walk(model.fields[key], obj[key] || (obj.data && obj.data[key]), key, obj)
  );
}
