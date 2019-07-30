import * as Cotype from "../../../typings";
import pick = require("lodash/pick");
import visit from "./visit";

export const getDeepJoins = (
  dp: Cotype.Join = {},
  models: Cotype.Model[]
): Cotype.Join[] => {
  const deeps: Cotype.Join = { ...dp };
  let deeperJoins = {};
  Object.entries(dp).forEach(([joinModel, fields]) => {
    const contentModel = models.find(
      m => m.name.toLowerCase() === joinModel.toLowerCase()
    );
    if (!contentModel) {
      return;
    }
    fields.forEach(f => {
      const [first, ...deepFields] = f.split(".");
      if (deepFields.length >= 1) {
        const topField = contentModel.fields[first];
        if (
          topField.type === "content" ||
          topField.type === "references" ||
          (topField.type === "list" &&
            (topField.item.type === "content" ||
              topField.item.type === "references"))
        ) {
          const searchModels = (("models" in topField && topField.models) ||
            ("model" in topField && [topField.model]) ||
            (topField.type === "list" &&
              "models" in topField.item &&
              topField.item.models) ||
            (topField.type === "list" &&
              "model" in topField.item && [topField.item.model]) ||
            []) as string[];
          deeperJoins = {
            ...searchModels.reduce<Cotype.Join>((acc, m) => {
              if (m) {
                if (acc[m]) {
                  acc[m] = [...acc[m], deepFields.join(".")];
                } else {
                  acc[m] = [deepFields.join(".")];
                }
              }
              return acc;
            }, deeperJoins)
          };
          deeps[joinModel] = fields.filter(fl => fl !== f);
          if (!deeps[joinModel].includes(first)) {
            deeps[joinModel].push(first);
          }
        }
      }
    });
  });
  if (Object.keys(deeperJoins).length > 0) {
    return [deeps, ...getDeepJoins(deeperJoins, models)];
  }

  return [deeps];
};
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
    _id: String(content.id),
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
  const withDeepJoins = getDeepJoins(join, models).reduce(
    (acc, j) => ({ ...acc, ...j }),
    {}
  );
  const filteredJoin = createJoin(withDeepJoins, models);

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
