import visit from "./visit";
import { Model } from "../../../typings";

const getAlwaysUniqueFields = (model: Model): string[] => {
  const uniqueFields: string[] = [...(model.uniqueFields || [])];
  visit({}, model, {
    position(s: string, f, d, stringPath) {
      if (stringPath) uniqueFields.push(stringPath);
    }
  });
  return uniqueFields;
};

export default getAlwaysUniqueFields

