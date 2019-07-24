import { ContentWithRefs, ListChunkWithRefs, Content } from "../../../typings";
import _pick from "lodash/pick";

export default function pickFieldsFromResultData(
  unpickedData: ContentWithRefs | ListChunkWithRefs<Content>,
  fields: string[]
) {
  if (!fields || !Array.isArray(fields) || !fields.length) return unpickedData;

  const pickNeededFields = (dataToPick: object) =>
    _pick(dataToPick, [...fields, "_id"]);

  let pickedData: typeof unpickedData;

  if ("items" in unpickedData) {
    const pickedItems = unpickedData.items.map(item => {
      const data = pickNeededFields(item.data);

      return {
        ...item,
        data
      };
    });

    pickedData = {
      ...unpickedData,
      items: pickedItems,
      _refs: unpickedData._refs
    };
  } else {
    const data = pickNeededFields(unpickedData.data);

    pickedData = {
      ...unpickedData,
      data,
      _refs: unpickedData._refs
    };
  }

  return pickedData;
}
