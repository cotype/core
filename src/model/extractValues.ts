import getAlwaysUniqueFields from "./getAlwaysUniqueFields";
import { Model } from "../../typings";
import visit from "./visit";
/**
 * Recursively walks through a content object and extracts all texts.
 */

const scalars = ["string", "number", "boolean", "position"];
const extractValues = (obj: object, model: Model) => {
  const values: any = {};
  const uniqueFields = [
    ...getAlwaysUniqueFields(model),
    model.title,
    model.orderBy
  ];
  const setValue = (
    path: string,
    value: any,
    index: boolean,
    i18n: boolean
  ) => {
    if (!index && !uniqueFields.includes(path)) {
      return;
    }
    if (typeof value === "undefined") {
      return;
    }
    if (i18n) {
      values[path] = Object.values(value);
    } else {
      values[path] = value;
    }
  };
  visit(
    obj,
    model,
    {
      string(s: string, field, d, stringPath) {
        setValue(stringPath, s, field.index, "i18n" in field && field.i18n);
      },
      number(s: string, field, d, stringPath) {
        setValue(stringPath, s, field.index, "i18n" in field && field.i18n);
      },
      boolean(s: string, field, d, stringPath) {
        setValue(stringPath, !!s, field.index, "i18n" in field && field.i18n);
      },
      position(s: string, field, d, stringPath) {
        setValue(stringPath, s, field.index, "i18n" in field && field.i18n);
      },
      list(arr: any[], field, d, stringPath) {
        if (!arr || arr.length === 0) {
          setValue(
            stringPath,
            "null",
            field.item.index,
            "i18n" in field && field.i18n
          );
        } else if (scalars.includes(field.item.type)) {
          setValue(
            stringPath,
            Array.isArray(arr || [])
              ? (arr || []).map((el: any) => el.value)
              : Object.fromEntries(
                  Object.entries(arr).map(([k, v]) => {
                    return [k, ((v || []) as any[]).map((el: any) => el.value)];
                  })
                ),
            field.item.index,
            "i18n" in field && field.i18n
          );
        } else if (field.item.type === "content") {
          setValue(
            stringPath,
            Array.isArray(arr)
              ? arr.map((el: any) => el.value && el.value.id)
              : Object.fromEntries(
                  Object.entries(arr).map(([k, v]) => {
                    return [
                      k,
                      (v as any[])
                        .map((el: any) => el.value && el.value.id)
                        .filter(Boolean)
                    ];
                  })
                ),
            field.item.index,
            "i18n" in field && field.i18n
          );
        } else if (field.item.type === "object") {
          const parse = (a: object[]) =>
            a.forEach((el: any) => {
              const objectValues: {
                [path: string]: {
                  value: string | null;
                  index: boolean;
                  i18n: boolean;
                }[];
              } = {};

              Object.entries(el.value).forEach(([key, v]: any) => {
                const t = (field.item.fields[key] || {}).type;
                if (!t) return;

                let value: string | null = null;

                if (scalars.includes(t)) value = v;
                if (v && t === "content") value = v.id;

                const n = `${stringPath}.${key}`;

                if (!objectValues[n]) {
                  objectValues[n] = [];
                }
                objectValues[n].push({
                  value,
                  index: field.item.fields[key].index,
                  i18n: "i18n" in field && field.i18n
                });
              });
              Object.entries(objectValues).forEach(([path, args]) =>
                setValue(
                  path,
                  args.map(v => v.value),
                  args[0].index,
                  args[0].i18n
                )
              );
            });
          Array.isArray(arr)
            ? parse(arr)
            : Object.values(arr).forEach(v => {
                parse(v as any);
              });
        }
      }
    },
    { flattenList: false }
  );
  return values;
};
export default extractValues;
