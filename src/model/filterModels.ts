import { Model, Models, Principal, Permissions } from "../../typings";

export function includeModel(model: Model, permissions: Permissions): boolean {
  const { content } = permissions;
  const { name } = model;

  if (name in content) {
    return content[name] > 0;
  }
  return content["*"] > 0;
}

export function createModelFilter(principal: Principal) {
  return (model: Model) => includeModel(model, principal.permissions);
}

export default function filterModels(models: Models, principal: Principal) {
  const { content, settings, media } = models;
  return {
    media,
    settings: principal.permissions.settings ? settings : [],
    content: content.filter(createModelFilter(principal))
  };
}
