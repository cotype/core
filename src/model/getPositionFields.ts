import * as Cotype from "../../typings";
import visit from "./visit";

const getPositionFields = (model: Cotype.Model): string[] => {
  const uniqueFields: string[] = [];
  visit({}, model, {
    position(s: string, f, d, stringPath) {
      if (stringPath) uniqueFields.push(stringPath);
    }
  });
  return uniqueFields;
};

export default getPositionFields;
