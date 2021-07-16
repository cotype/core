import getAlwaysUniqueFields from "./getAlwaysUniqueFields";
import { Model } from "../../typings";
import visit from "./visit";
/**
 * Recursively walks through a content object and extracts all texts.
 */

const scalars = ["string", "number", "boolean", "position"];
const extractValues = (
  obj: object,
  model: Model
): { [s: string]: { v: string; lang?: string }[] } => {
  const values: { [s: string]: { v: string; lang?: string }[] } = {};
  const uniqueFields = [
    ...getAlwaysUniqueFields(model),
    model.title,
    model.orderBy
  ];
  const setValue = (
    path: string,
    value: any,
    index: boolean,
    i18n?: string
  ) => {
    if (!index && !uniqueFields.includes(path)) {
      return;
    }
    if (typeof value === "undefined") {
      return;
    }
    if (!values[path]) {
      values[path] = [];
    }
    if (Array.isArray(value)) {
      value.forEach(v =>
        values[path].push({
          lang: i18n,
          v
        })
      );
    } else {
      values[path].push({
        lang: i18n,
        v: value
      });
    }
  };
  visit(
    obj,
    model,
    {
      string(s: string, field, d, stringPath, langKey) {
        setValue(stringPath, s, field.index, langKey);
      },
      number(s: string, field, d, stringPath, langKey) {
        setValue(stringPath, s, field.index, langKey);
      },
      boolean(s: string, field, d, stringPath, langKey) {
        setValue(stringPath, !!s, field.index, langKey);
      },
      position(s: string, field, d, stringPath, langKey) {
        setValue(stringPath, s, field.index, langKey);
      },
      list(arr: any[], field, d, stringPath, langKey) {
        if (!arr || arr.length === 0) {
          setValue(stringPath, "null", field.item.index, langKey);
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
            langKey
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
            langKey
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
                  langKey
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
