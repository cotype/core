import { Model, QuillDelta } from "../../typings";

/**
 * Recursively walks through a content object and extracts all texts.
 */
import visit from "./visit";
import formatQuillDelta from "../content/formatQuillDelta";

export default function extractText(obj: object, model: Model) {
  const tokens: string[] = [];
  visit(obj, model, {
    string(s: string) {
      if (s) tokens.push(s);
    },
    number(n: number) {
      tokens.push(String(n));
    },
    richtext(delta: QuillDelta) {
      tokens.push(formatQuillDelta(delta, "plaintext"));
    }
  });
  return tokens.join(" ");
}
