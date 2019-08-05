import {
  Model,
  QuillDelta,
  Data,
  ContentRefs,
  PreviewOpts,
  ContentFormat
} from "../../typings";
import urlJoin from "url-join";
import visit from "../model/visit";
import formatQuillDelta from "./formatQuillDelta";
import getRefUrl from "./getRefUrl";

/**
 * Converts a content from its internal representation to a format
 * requested by the client.
 */

type ConvertProps = {
  content: Data;
  contentRefs?: ContentRefs;
  contentModel: Model;
  allModels: Model[];
  contentFormat: ContentFormat;
  mediaUrl: string;
  previewOpts?: PreviewOpts;
};
export default function convert({
  content,
  contentRefs,
  contentModel,
  allModels,
  contentFormat = "html",
  mediaUrl,
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
                el.attributes.link = urlJoin(mediaUrl, mediaMatch[1]);
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

        const isAbsoluteRef = !ref.model;

        if (isAbsoluteRef) {
          convertedRef._url = ref.id;
          return convertedRef;
        }

        // For external data sources content references don't exist
        if (!contentRefs || !contentRefs[ref.model]) return convertedRef;

        const refModel = allModels.find(
          m => m.name.toLowerCase() === ref.model.toLowerCase()
        );
        if (!refModel || !refModel.urlPath) return convertedRef;

        const allRefData = contentRefs[ref.model][ref.id];
        convertedRef._url = getRefUrl(
          (allRefData || {}).data,
          refModel.urlPath
        );

        return convertedRef;
      }
    },
    media(media: string) {
      if (media)
        return {
          _id: media,
          _ref: "media",
          _src: urlJoin(mediaUrl, media)
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
