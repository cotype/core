import * as Cotype from "../../typings";
import visit from "./visit";
import { InverseReferenceType } from "../../typings";

const getInverseReferenceFields = (
  model: Cotype.Model
): { path: string; model: string; fieldName: string }[] => {
  const referenceFields: {
    path: string;
    model: string;
    fieldName: string;
  }[] = [];
  visit({}, model, {
    references(_value, field: InverseReferenceType, _parent, path) {
      if (path)
        referenceFields.push({
          path,
          model: field.model,
          fieldName: field.fieldName
        });
    }
  },{calli18nMultipleTimes:true});
  return referenceFields;
};

export default getInverseReferenceFields;
