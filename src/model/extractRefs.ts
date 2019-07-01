import * as Cotype from "../../typings";

/**
 * Recursively walks through a content object and finds all media
 * or content references.
 */
import visit from "./visit";
import { QuillDelta } from "../../typings";

type BuildRef = {
  content?: number;
  media?: string;
  fieldNames?: string[];
  optional: boolean;
};

type Ref = {
  content?: number;
  media?: string;
  fieldNames?: string;
  optional: boolean;
};

export default function extractRefs(
  obj: object,
  model: Cotype.Model,
  models: Cotype.Model[]
): Ref[] {
  const refs: BuildRef[] = [];

  visit(obj, model, {
    richtext(delta: QuillDelta) {
      if (delta && delta.ops) {
        delta.ops.forEach(el => {
          if (el.attributes && el.attributes.link) {
            const match = /\$intern:([\w]*):([0-9]*)\$/gm.exec(
              el.attributes.link
            );

            if (match) {
              const refModel = models.find(
                m => m.name.toLocaleLowerCase() === match[1].toLocaleLowerCase()
              );
              if (refModel && match[2]) {
                refs.push({ content: parseInt(match[2], 10), optional: false });
              }
            }
          }
        });
      }
    },
    media(media: string, field) {
      if (media && !refs.some(ref => "media" in ref && ref.media === media)) {
        refs.push({ media, optional: !field.required });
      }
    },
    content(content: { id: number; model: string }, field, del, fieldPath) {
      if (content) {
        if (!content.model) return;
        // only extract internal refs
        const refModel = models.find(
          m => m.name.toLowerCase() === content.model.toLowerCase()
        );
        if (!refModel || refModel.external) return;
        const oldRef = refs.find(
          ref => "content" in ref && ref.content === content.id
        );

        if (oldRef && oldRef.fieldNames) {
          // When Ref to this field already exists, add field~
          oldRef.fieldNames.push(fieldPath);
        } else {
          refs.push({
            content: content.id,
            optional: !field.required,
            fieldNames: [fieldPath]
          });
        }
      }
    }
  });

  return refs.map(({ fieldNames, ...ref }) =>
    fieldNames ? { fieldNames: fieldNames.join("~"), ...ref } : ref
  );
}
