import * as Cotype from "../../typings";
import visit from "./visit";
import middleString from "../utils/middleString";

/**
 * SetPosition Field
 */

export const firstMudderCharacter = "0";

export default function setPosition(
  obj: object,
  model: Cotype.Model,
  lastPos: string = firstMudderCharacter,
  nextPos?: string,
  forcePositionSet?: boolean,
  stringPath?: string
) {
  visit(obj, model, {
    position(pos: string, f, d, path: string) {
      if ((stringPath && stringPath === path) || !stringPath) {
        if (!pos || forcePositionSet) {
          return middleString(
            lastPos,
            nextPos === lastPos ? nextPos + "z" : nextPos
          );
        }
      }
    }
  });
  return obj;
}
