import {
  ContentWithRefs,
  Refs,
  MediaRefs,
  ContentRefs,
  Data
} from "../../typings";

type Converters = {
  [key: string]: (data: any) => void;
};

export default function refsMerger(
  data: ContentWithRefs,
  converters: Converters
) {
  const { _refs, ...obj1 } = data;
  if (!_refs) return;
  const walk = (obj2: Data) => {
    if (!obj2) return;
    if (typeof obj2 !== "object") return;
    if (Array.isArray(obj2)) {
      obj2.forEach(walk);
      return;
    }
    Object.keys(obj2).forEach(key => {
      const value = obj2[key];
      if (key === "_ref") {
        const id = obj2._id;
        const refs = _refs[value as keyof Refs];
        if (!refs || !id) return;

        const type: string | undefined = obj2[`_${value}`];
        const lookup = type ? (refs as ContentRefs)[type] : (refs as MediaRefs);
        if (!lookup) return;

        const ref = lookup[id];
        if (ref) {
          walk(ref);
          if (value in converters) {
            converters[value](ref);
          }
          Object.assign(obj2, ref);
        }
      }
      walk(value);
    });
  };
  walk(obj1);

  return obj1;
}
