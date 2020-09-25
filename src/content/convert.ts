import {
  Model,
  QuillDelta,
  Data,
  ContentRefs,
  PreviewOpts,
  ContentFormat,
  VirtualType,
  Language
} from "../../typings";
import urlJoin from "url-join";
import visit, { NO_STORE_VALUE } from "../model/visit";
import formatQuillDelta from "./formatQuillDelta";
import getRefUrl from "./getRefUrl";

type ContentRef = {
  id: string;
  model: string;
};
type ReverseRef = {
  _id: string;
  _ref: string;
  _content: string;
};
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
  mediaUrl: string;
  previewOpts?: PreviewOpts;
  language?: string;
  fallBackLanguage?: Language;
};
export default function convert({
  content,
  contentRefs,
  contentModel,
  allModels,
  contentFormat = "html",
  mediaUrl,
  previewOpts = {},
  language,
  fallBackLanguage
}: ConvertProps) {
  /**
   * Converts content-references of type content
   * and reverse-references of type references
   */
  const convertReferences = (ref: ContentRef | ReverseRef, field: any) => {
    if (ref) {
      const convertedRef: any =
        "_id" in ref
          ? ref
          : {
              _id: ref.id,
              _ref: field.type,
              _content: ref.model
            };

      // ONLY RELEVANT FOR CONTENT-REFERENCES:
      // Refs can only contain an id but no model,
      // this means the ref is not actually a ref but a string
      const isAbsoluteRef = !convertedRef._content;
      if (isAbsoluteRef) {
        convertedRef._url = convertedRef._id;
        return convertedRef;
      }

      const referencedModel = allModels.find(
        m => m.name.toLowerCase() === convertedRef._content.toLowerCase()
      );

      // No content for the ref was provided,
      // this means the referenced content does not exists anymore.
      // This happens when content get deleted or is scheduled
      if (!referencedModel) {
        return NO_STORE_VALUE;
      }

      // ONLY RELEVANT FOR CONTENT-REFERENCES:
      // For external data sources content references don't exist
      if (referencedModel.external) return convertedRef;

      // If the referenced content has no `urlPath`,
      // we don't need to add the `_url`
      if (!referencedModel.urlPath) return convertedRef;

      // No content for the ref was provided,
      // this means the referenced content does not exists anymore.
      // This happens when content get deleted or is scheduled
      if (
        !contentRefs[convertedRef._content] ||
        !contentRefs[convertedRef._content][convertedRef._id]
      ) {
        return NO_STORE_VALUE;
      }

      const allRefData = contentRefs[convertedRef._content][convertedRef._id];
      convertedRef._url = getRefUrl(
        (allRefData || {}).data,
        referencedModel.urlPath
      );

      return convertedRef;
    }
  };

  visit(content, contentModel, {
    i18n(value: { [lang: string]: any }) {
      if (language && language in value) {
        return value[language];
      }
      if (fallBackLanguage && fallBackLanguage.key in value) {
        return value[fallBackLanguage.key];
      }
      return value[Object.keys(value)[0]];
    },
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
    list(list: { key: number; value: object }[]) {
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
    content: convertReferences,
    references(refs, field) {
      if (Array.isArray(refs))
        return refs
          .map(r => convertReferences(r, field))
          .filter(r => r !== NO_STORE_VALUE);
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
    },
    virtual(_data, field: VirtualType) {
      if (field.get) {
        return field.get(content);
      }
      return undefined;
    }
  });
  return content;
}
