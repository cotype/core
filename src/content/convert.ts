import {
  Model,
  QuillDelta,
  BaseUrls,
  Data,
  ContentRefs,
  PreviewOpts,
  ContentFormat
} from "../../typings";
import visit, { NO_STORE_VALUE } from "../model/visit";
import formatQuillDelta from "./formatQuillDelta";
import getRefUrl from "./getRefUrl";

/**
 * Converts a content from its internal representation to a format
 * requested by the client.
 */

type ConvertProps = {
  content: Data;
  contentRefs: ContentRefs;
  contentModel: Model;
  allModels: Model[];
  contentFormat: ContentFormat;
  baseUrls?: BaseUrls;
  previewOpts?: PreviewOpts;
};
export default function convert({
  content,
  contentRefs,
  contentModel,
  allModels,
  contentFormat = "html",
  baseUrls,
  previewOpts = {}
}: ConvertProps) {
  visit(content, contentModel, {
    richtext(delta: QuillDelta) {
      if (delta && delta.ops) {
        delta.ops = delta.ops.map(el => {
          if (el.attributes && el.attributes.link && contentRefs) {
            const match = /\$intern:([\w]*):([0-9]*)\$/gm.exec(
              el.attributes.link
            );
            if (match) {
              const model = allModels.find(
                m => m.name.toLocaleLowerCase() === match[1].toLocaleLowerCase()
              );
              if (
                model &&
                contentRefs[model.name] &&
                contentRefs[model.name][match[2]]
              ) {
                const data = contentRefs[model.name][match[2]];
                if (data && data.data) {
                  el.attributes.link = getRefUrl(data.data, model.urlPath);
                }
              } else {
                el.attributes.link = "";
              }
            } else {
              const mediaMatch = /\$media:([\w\/\.]*)\$/gm.exec(
                el.attributes.link
              );
              if (mediaMatch) {
                el.attributes.link =
                  (baseUrls && baseUrls.media ? baseUrls.media : "/media/") +
                  mediaMatch[1];
              }
            }
          }

          return el;
        });
      }
      if (contentFormat) return formatQuillDelta(delta, contentFormat);
    },
    list(list: Array<{ key: number; value: object }>) {
      const { publishedOnly, ignoreSchedule } = previewOpts;

      const visible = (item: any) => {
        if (!publishedOnly || ignoreSchedule) return true;
        const now = new Date();
        const future = item.visibleFrom && new Date(item.visibleFrom) > now;
        const past = item.visibleUntil && new Date(item.visibleUntil) < now;
        return !(future || past);
      };

      return list && Array.isArray(list)
        ? list
            .filter(Boolean)
            .filter(visible)
            .map(l => {
              return l.value !== undefined ? l.value : l;
            })
        : [];
    },
    content(ref: { id: string; model: string }, field) {
      if (ref) {
        const convertedRef: any = {
          _id: ref.id,
          _ref: field.type,
          _content: ref.model
        };

        // Refs can only contain an id but no model,
        // this means the ref is not actually a ref but a string
        const isAbsoluteRef = !ref.model;
        if (isAbsoluteRef) {
          convertedRef._url = ref.id;
          return convertedRef;
        }

        const referencedModel = allModels.find(
          m => m.name.toLowerCase() === ref.model.toLowerCase()
        );

        // For external data sources content references don't exist
        if (referencedModel!.external) return convertedRef;

        // No content for the ref was provided,
        // this means the referenced content does not exists anymore.
        // This happens when content get deleted or is scheduled
        if (!referencedModel || !contentRefs[ref.model]) return NO_STORE_VALUE;

        // If the referenced content has no `urlPath`,
        // we don't need to add the `_url`
        if (!referencedModel.urlPath) return convertedRef;

        const allRefData = contentRefs[ref.model][ref.id];
        convertedRef._url = getRefUrl(
          (allRefData || {}).data,
          referencedModel.urlPath
        );

        return convertedRef;
      }
    },
    media(media: string) {
      if (media)
        return {
          _id: media,
          _ref: "media",
          _src: `${
            baseUrls && baseUrls.media ? baseUrls.media : "/media/"
          }${media}`
        };
    },
    union(
      data: { _type: string },
      field: { types: { [key: string]: object } }
    ) {
      if (!Object.keys(field.types).includes(data._type)) return null;
    }
  });
  return content;
}
