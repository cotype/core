import * as Cotype from "../../typings";

export function hasType(model: Cotype.Model, name: string) {
  return collectTypes(model).some(type => type.type === name);
}

function collectTypes(model: Cotype.Model) {
  const types: Cotype.Type[] = [];
  Object.values(model.fields).forEach(type => {
    collect(types, type);
  });
  return types;
}

function collect(types: Cotype.Type[], type: Cotype.Type) {
  types.push(type);
  if (type.type === "object") {
    Object.values(type.fields).forEach(fieldType => {
      collect(types, fieldType);
    });
  }
  if (type.type === "list") {
    collect(types, type.item);
  }
  if (type.type === "union") {
    Object.values(type.types).forEach(typeType => {
      collect(types, typeType);
    });
  }
}
