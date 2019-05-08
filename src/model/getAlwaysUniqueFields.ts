import * as Cotype from "../../typings";
import visit from "./visit";

const getAlwaysUniqueFields = (model: Cotype.Model): string[] => {
  const uniqueFields: string[] = [...(model.uniqueFields || [])];
  visit({}, model, {
    position(s: string, f, d, stringPath) {
      if (stringPath) uniqueFields.push(stringPath);
    }
  });
  return uniqueFields;
};

export default getAlwaysUniqueFields;
