import * as Cotype from "../../typings";

export default function visitModel(
  model: Cotype.Model | Cotype.ObjectType,
  visitor: (key: string, field: Cotype.Type) => void
) {
  const walk = (fieldKey: string, field2: Cotype.Type) => {
    if (field2.type === "object") {
      Object.entries(field2.fields).forEach(([key, field3]) => {
        walk(key, field3);
      });
    } else if (field2.type === "list") {
      walk(fieldKey, field2.item);
    } else if (field2.type === "union") {
      Object.entries(field2.types).forEach(([key, field3]) => {
        walk(key, field3);
      });
    }
    if (field2.type === "immutable") {
      walk(fieldKey, field2.child);
    } else {
      visitor(fieldKey, field2);
    }
  };

  Object.entries(model.fields).forEach(([field, props]) => {
    walk(field, props);
  });
}
