import * as Cotype from "../../../typings";
import pick = require("lodash/pick");
import visit from "./visit";

export const createJoin = (join: Cotype.Join, models: Cotype.Model[]) => {
  // const joins = Object.keys(join || {});
  const filteredJoins: Cotype.Join = {};
  if (!join) return filteredJoins;

  // add wildcard possibility for model names
  Object.entries(join).forEach(([type, joins]) => {
    type = type.toLowerCase();

    if (type.startsWith("*")) {
      const modelPostfix = type.substring(1);
      models.forEach(m => {
        const modelName = m.name.toLowerCase();

        if (modelName.endsWith(modelPostfix)) {
          // keep all rules, dont overwrite

          filteredJoins[modelName] = filteredJoins[modelName]
            ? filteredJoins[modelName].concat(joins)
            : joins;
        }
      });
    } else if (models.find(m => m.name.toLowerCase() === type)) {
      filteredJoins[type] = filteredJoins[type]
        ? filteredJoins[type].concat(joins)
        : joins;
    }
  });
  return filteredJoins;
};

export const filterContentData = (
  content: Cotype.Content,
  join: Cotype.Join
) => {
  return {
    ...pick(content.data, join[content.type.toLowerCase()]),
    _id: content.id,
    _type: content.type
  };
};

export const getContainingMedia = (
  content: Cotype.Data,
  model: Cotype.Model,
  media: Cotype.MediaRefs
) => {
  const containingMedia: Cotype.MediaRefs = {};
  if (model && content) {
    visit(content, model, {
      media(m: { _id: string } | null) {
        if (!m) return;
        if (media[m._id]) containingMedia[m._id] = media[m._id];
      }
    });
  }
  return containingMedia;
};

export default function(
  contents: Cotype.Content[],
  refs: Cotype.Refs,
  join: Cotype.Join,
  models: Cotype.Model[]
): Cotype.Refs {
  const filteredJoin = createJoin(join, models);

  const content: any = {};
  const media: any = {};

  const getModel = (name: string) =>
    models.find(m => m.name.toLowerCase() === name.toLowerCase());

  // add all media files from the main contents
  contents.forEach(c => {
    Object.assign(
      media,
      getContainingMedia(c.data, getModel(c.type)!, refs.media)
    );
  });

  Object.keys(refs.content).forEach(type => {
    if (
      Object.keys(filteredJoin)
        .map(j => j.toLowerCase())
        .includes(type.toLowerCase())
    ) {
      content[type] = {};

      Object.entries(refs.content[type]).forEach(([key, value]) => {
        content[type][key] = filterContentData(value, filteredJoin);
        Object.assign(
          media,
          getContainingMedia(value.data, getModel(value.type)!, refs.media)
        );
      });
    }
  });

  return {
    content,
    media
  };
}
