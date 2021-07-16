import * as Cotype from "../../typings";
import visit from "./visit";

const getPositionFields = (model: Cotype.Model): string[] => {
  const uniqueFields: string[] = [];
  visit(
    {},
    model,
    {
      position(s: string, f, d, stringPath) {
        if (stringPath) uniqueFields.push(stringPath);
      }
    }
  );
  return uniqueFields;
};

export default getPositionFields;

export const getPositionFieldsWithValue = (
  data: any,
  model: Cotype.Model
): { fieldPath: string; value: string }[] => {
  const fields: { fieldPath: string; value: string }[] = [];
  visit(
    data,
    model,
    {
      position(s: string, f, d, stringPath) {
        if (stringPath)
          fields.push({
            value: s,
            fieldPath: stringPath
          });
      }
    }
  );
  return fields;
};
