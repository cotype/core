import * as Cotype from "../../typings";

/**
 * Recursively walks through a content object and finds all media
 * or content references.
 */
import visit from "./visit";
import { QuillDelta } from "../../typings";

type Ref = {
  content?: number;
  media?: string;
  optional: boolean;
};

export default function extractRefs(
  obj: object,
  model: Cotype.Model,
  models: Cotype.Model[]
) {
  const refs: Ref[] = [];

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
    content(content: { id: number; model: string }, field) {
      if (
        content &&
        !refs.some(ref => "content" in ref && ref.content === content.id)
      ) {
        if (!content.model) return;
        // only extract internal refs
        const refModel = models.find(
          m => m.name.toLowerCase() === content.model.toLowerCase()
        );
        if (!refModel || refModel.external) return;
        refs.push({ content: content.id, optional: !field.required });
      }
    }
  });
  return refs;
}
