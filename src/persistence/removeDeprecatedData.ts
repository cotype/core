import { Model, UnionType } from "../../typings";
import visit from "../model/visit";

/**
 * Filters Request
 */
export default function removeDeprecatedData(
  obj: any,
  model: Model,
  internal?: boolean
) {
  visit(obj, model, {
    // Remove falsy list items.
    list(list: { key: number; value: object }[]) {
      return list && Array.isArray(list) && list.filter(Boolean);
    },

    // Remove items with an unknown _type
    union(data: { _type: string }, field: UnionType) {
      if (data && !Object.keys(field.types).includes(data._type)) return null;
    }
  },{withI18nFlag:true});
  return obj;
}
