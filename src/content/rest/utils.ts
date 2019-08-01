import { Model } from "../../../typings";

// all models that have their own page
export function linkableModelNames(models: Model[]) {
  return models.filter(m => !!m.urlPath).map(m => m.name);
}

// all models that have their own page and not excluded from search
export function linkableAndSearchableModelNames(models: Model[]) {
  return models.filter(m => !m.notSearchAble && m.urlPath).map(m => m.name);
}

// all models that are not specifically excluded from search
export function searchableModelNames(models: Model[]) {
  return models.filter(m => !m.notSearchAble).map(m => m.name);
}
