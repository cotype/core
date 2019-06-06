import * as Cotype from "../../typings";
import visit from "./visit";

const getAlwaysUniqueFields = (model: Cotype.Model, noPositionFields?:boolean): string[] => {
  const uniqueFields: string[] = [...(model.uniqueFields || [])];
  visit({}, model, {
    position(s: string, f, d, stringPath) {
      if (stringPath && !noPositionFields) uniqueFields.push(stringPath);
    }
  });
  return uniqueFields;
};

export default getAlwaysUniqueFields;
