import {
  Model,
  QuillDelta,
  StringType,
  NumberType,
  RichtextType
} from "../../typings";

/**
 * Recursively walks through a content object and extracts all texts.
 */
import visit from "./visit";
import formatQuillDelta from "../content/formatQuillDelta";

export default function extractText(obj: object, model: Model) {
  const tokens: string[] = [];
  visit(
    obj,
    model,
    {
      string(s: string, field: StringType, _del, stringPath) {
        if (s && field.search !== false) tokens.push(s);
      },
      number(n: number, field: NumberType) {
        if (field.search !== false) tokens.push(String(n));
      },
      richtext(delta: QuillDelta, field: RichtextType) {
        const text = formatQuillDelta(delta, "plaintext");
        if (text && field.search !== false) tokens.push(text);
      }
    },
    { calli18nMultipleTimes: true }
  );
  return tokens.join(" ");
}
