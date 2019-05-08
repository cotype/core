import * as Cotype from "../../../typings";
import visit from "./visit";
import getAlwaysUniqueFields from "./getAlwaysUniqueFields";

export type Filter = {
  [s: string]: {
    input?: string;
    label?: string;
    type: string;
    models?: string[];
  };
};

const scalars = ["string", "number", "boolean"];
const extractFilter = (model: Cotype.Model): Filter => {
  const filter: Filter = {};
  if (model.type !== "content" || model.external) {
    return filter;
  }
  const uniqueFields = [...getAlwaysUniqueFields(model), model.title];
  const setField = (
    field: Cotype.Field,
    path: string,
    forceIndex?: boolean
  ) => {
    if (!("index" in field) && !uniqueFields.includes(path) && !forceIndex) {
      return;
    }
    const models = [
      ...("models" in field && field.models ? field.models : []),
      ...("model" in field && field.model ? [field.model] : [])
    ];
    filter[path] = {
      type: field.type,
      label: field.label
    };
    if ("input" in field) {
      filter[path].input = field.input;
    }
    if (models.length > 0) {
      filter[path].models = models;
    }
  };
  visit({}, model, {
    string(s, field, d, stringPath) {
      setField(field, stringPath);
    },
    number(s, field, d, stringPath) {
      setField(field, stringPath);
    },
    boolean(s, field, d, stringPath) {
      setField(field, stringPath);
    },
    list(s, field, d, stringPath) {
      if (scalars.includes(field.item.type)) {
        setField(field, stringPath, field.item.index);
      }
    },
    content(s, field, d, stringPath) {
      setField(field, stringPath);
    }
  });
  return filter;
};

export default extractFilter;
