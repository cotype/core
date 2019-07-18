import {
  ContentWithRefs,
  ListChunkWithRefs,
  Content,
  Model,
  Refs
} from "../../../typings";
import _pick from "lodash/pick";
import visit from "./visit";

export default function pickFieldsFromResultData(
  unpickedData: ContentWithRefs | ListChunkWithRefs<Content>,
  fields: string[],
  model: Model
) {
  if (!fields || !Array.isArray(fields) || !fields.length) return unpickedData;

  const mediaToInclude: string[] = [];
  const contentToInclude: any = {};

  const pickNeededFields = (dataToPick: object) =>
    _pick(dataToPick, [...fields, "_id"]);
  const registerNeededRefs = (dataToWalk: object) =>
    visit(dataToWalk, model, {
      media: value => {
        if (value) mediaToInclude.push(value._id);
      },
      content: value => {
        if (value) {
          if (!contentToInclude[value._content])
            contentToInclude[value._content] = {};
          contentToInclude[value._content][value._id] = {};
        }
      }
    });

  const pickNeededRefs = (refs: Refs) => {
    const _refs: Refs = {
      content: {},
      media: {}
    };

    Object.keys(refs.media).forEach(key => {
      if (mediaToInclude.includes(key)) _refs.media[key] = refs.media[key];
    });
    Object.keys(refs.content).forEach(key => {
      if (contentToInclude[key]) {
        _refs.content[key] = refs.content[key];
      }
    });
    return _refs;
  };

  let pickedData: typeof unpickedData;

  if ("items" in unpickedData) {
    const pickedItems = unpickedData.items.map(item => {
      const data = pickNeededFields(item.data);
      registerNeededRefs(data);

      return {
        ...item,
        data
      };
    });

    pickedData = {
      ...unpickedData,
      items: pickedItems,
      _refs: pickNeededRefs(unpickedData._refs)
    };
  } else {
    const data = pickNeededFields(unpickedData.data);
    registerNeededRefs(data);

    pickedData = {
      ...unpickedData,
      data,
      _refs: pickNeededRefs(unpickedData._refs)
    };
  }

  return pickedData;
}
