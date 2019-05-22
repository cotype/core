import * as Cotype from "../../typings";
import visit from "./visit";
import { InverseReferenceType } from "../../typings";

const getInverseReferenceFields = (
  model: Cotype.Model
): Array<{ path: string; model: string }> => {
  const referenceFields: Array<{ path: string; model: string }> = [];
  visit({}, model, {
    references(_value, field: InverseReferenceType, _parent, path) {
      if (path)
        referenceFields.push({
          path,
          model: field.model
        });
    }
  });
  return referenceFields;
};

export default getInverseReferenceFields;
