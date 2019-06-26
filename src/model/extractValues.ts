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
  const setValue = (path: string, value: any, index: boolean) => {
    if (!index && !uniqueFields.includes(path)) {
      return;
    }
    if (typeof value === "undefined") {
      return;
    }
    values[path] = value;
  };
  visit(
    obj,
    model,
    {
      string(s: string, field, d, stringPath) {
        setValue(stringPath, s, field.index);
      },
      number(s: string, field, d, stringPath) {
        setValue(stringPath, s, field.index);
      },
      boolean(s: string, field, d, stringPath) {
        setValue(stringPath, !!s, field.index);
      },
      position(s: string, field, d, stringPath) {
        setValue(stringPath, s, field.index);
      },
      list(arr: any[], field, d, stringPath) {
        if (!arr || arr.length === 0) {
          setValue(stringPath, "null", field.item.index);
        } else if (scalars.includes(field.item.type)) {
          setValue(
            stringPath,
            arr.map((el: any) => el.value),
            field.item.index
          );
        } else if (field.item.type === "content") {
          setValue(
            stringPath,
            arr.map((el: any) => el.value && el.value.id).filter(Boolean),
            field.item.index
          );
        } else if (field.item.type === "object") {
          arr.forEach((el: any) => {
            const objectValues: {
              [path: string]: Array<{ value: string | null; index: boolean }>;
            } = {};

            Object.entries(el.value).forEach(([key, v]: any) => {
              const t = (field.item.fields[key] || {}).type;
              if (!t) return;

              let value: string | null = null;

              if (scalars.includes(t)) value = v;
              if (t === "content") value = v.id;

              const n = `${stringPath}.${key}`;

              if (!objectValues[n]) {
                objectValues[n] = [];
              }
              objectValues[n].push({
                value,
                index: field.item.fields[key].index
              });
            });

            Object.entries(objectValues).forEach(([path, args]) =>
              setValue(path, args.map(v => v.value), args[0].index)
            );
          });
        }
      }
    },
    { flattenList: false }
  );

  return values;
};
export default extractValues;
